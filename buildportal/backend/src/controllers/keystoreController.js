import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import Keystore from '../models/Keystore.js';
import { uploadBufferToS3, getPresignedDownloadUrl, deleteFromS3 } from '../services/s3Service.js';
import { AppError } from '../middleware/errorHandler.js';

const storage = multer.memoryStorage();
export const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const execPromise = promisify(exec);

export async function uploadKeystore(req, res) {
  if (!req.file) throw new AppError('No keystore file provided', 400);
  const { projectId, projectName, provider, keystoreAlias, keystorePassword, keyPassword, firebaseAppId, firebaseCliToken } = req.body;

  const projectIdStr = String(projectId);
  const s3Key = `keystores/${req.user._id}/${projectIdStr}/${Date.now()}_${req.file.originalname}`;
  await uploadBufferToS3({ key: s3Key, buffer: req.file.buffer, contentType: 'application/octet-stream' });

  const ks = await Keystore.findOneAndUpdate(
    { userId: req.user._id, projectId: projectIdStr },
    { projectName, provider, keystoreS3Key: s3Key, keystoreAlias, keystorePassword, keyPassword, firebaseAppId, firebaseCliToken, originalFilename: req.file.originalname, uploadedAt: new Date() },
    { upsert: true, new: true }
  );

  res.json({ keystore: { id: ks._id, projectId: ks.projectId, projectName: ks.projectName, filename: ks.originalFilename, keystoreAlias: ks.keystoreAlias, uploadedAt: ks.uploadedAt } });
}

export async function generateKeystore(req, res) {
  const { projectId, projectName, provider, keystoreAlias, keystorePassword, keyPassword, firebaseCliToken, commonName, organization } = req.body;

  if (!projectId || !projectName || !keystoreAlias || !keystorePassword || !keyPassword) {
    throw new AppError('Missing required parameters for keystore generation', 400);
  }

  const projectIdStr = String(projectId);
  const originalFilename = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_release.keystore`;
  
  // Create temp dir inside workspace
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tempFilePath = path.join(tempDir, `${Date.now()}_${originalFilename}`);

  const cn = commonName || 'BuildPortal';
  const org = organization || 'MobileBuildPortal';

  // keytool command to generate JKS keystore non-interactively
  const cmd = `keytool -genkeypair -v -keystore "${tempFilePath}" -alias "${keystoreAlias}" -keyalg RSA -keysize 2048 -validity 10000 -storepass "${keystorePassword}" -keypass "${keyPassword}" -dname "CN=${cn}, O=${org}, C=US" -noprompt`;

  try {
    // Generate keystore via keytool
    await execPromise(cmd);

    // Read generated file buffer
    if (!fs.existsSync(tempFilePath)) {
      throw new Error('Keytool failed to generate the keystore file.');
    }
    const buffer = fs.readFileSync(tempFilePath);

    // Upload to S3
    const s3Key = `keystores/${req.user._id}/${projectIdStr}/${Date.now()}_${originalFilename}`;
    await uploadBufferToS3({ key: s3Key, buffer, contentType: 'application/octet-stream' });

    // Save/Update in database
    const ks = await Keystore.findOneAndUpdate(
      { userId: req.user._id, projectId: projectIdStr },
      { 
        projectName, 
        provider, 
        keystoreS3Key: s3Key, 
        keystoreAlias, 
        keystorePassword, 
        keyPassword, 
        firebaseAppId: '', 
        firebaseCliToken, 
        originalFilename, 
        uploadedAt: new Date() 
      },
      { upsert: true, new: true }
    );

    res.json({ keystore: { id: ks._id, projectId: ks.projectId, projectName: ks.projectName, filename: ks.originalFilename, keystoreAlias: ks.keystoreAlias, uploadedAt: ks.uploadedAt } });
  } catch (err) {
    throw new AppError(`Failed to generate keystore: ${err.message}`, 500);
  } finally {
    // Clean up local temp file from workspace
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (unlinkErr) {
        console.error('Failed to cleanup temp keystore file:', unlinkErr.message);
      }
    }
  }
}

export async function getKeystore(req, res) {
  const { projectId } = req.params;
  const ks = await Keystore.findOne({ userId: req.user._id, projectId: String(projectId) });
  if (!ks) return res.json({ keystore: null });
  res.json({ keystore: { id: ks._id, projectId: ks.projectId, projectName: ks.projectName, filename: ks.originalFilename, keystoreAlias: ks.keystoreAlias, uploadedAt: ks.updatedAt, firebaseAppId: ks.firebaseAppId, firebaseCliToken: ks.firebaseCliToken } });
}

export async function listKeystores(req, res) {
  const ks = await Keystore.find({ userId: req.user._id }).select('-keystorePassword -keyPassword');
  res.json({ keystores: ks });
}

export async function downloadKeystore(req, res) {
  const { projectId } = req.params;
  const ks = await Keystore.findOne({ userId: req.user._id, projectId: String(projectId) });
  if (!ks || !ks.keystoreS3Key) throw new AppError('No keystore found for this project', 404);

  const filename = ks.originalFilename || `${projectId}.keystore`;
  const url = await getPresignedDownloadUrl(ks.keystoreS3Key, filename);
  res.json({ url, filename });
}

export async function deleteKeystore(req, res) {
  const { projectId } = req.params;
  const ks = await Keystore.findOne({ userId: req.user._id, projectId: String(projectId) });
  if (!ks) throw new AppError('No keystore found for this project', 404);

  if (ks.keystoreS3Key) {
    await deleteFromS3(ks.keystoreS3Key);
  }
  await Keystore.deleteOne({ _id: ks._id });
  res.json({ success: true });
}

export async function updateFirebaseConfig(req, res) {
  const { projectId, firebaseCliToken } = req.body;
  if (!projectId) throw new AppError('Missing projectId', 400);

  const ks = await Keystore.findOneAndUpdate(
    { userId: req.user._id, projectId: String(projectId) },
    { firebaseCliToken },
    { new: true }
  );

  if (!ks) throw new AppError('No keystore found for this project. Upload a keystore first.', 404);

  res.json({ keystore: { id: ks._id, projectId: ks.projectId, projectName: ks.projectName, filename: ks.originalFilename, uploadedAt: ks.updatedAt, firebaseCliToken: ks.firebaseCliToken } });
}
import multer from 'multer';
import Keystore from '../models/Keystore.js';
import { uploadBufferToS3 } from '../services/s3Service.js';
import { AppError } from '../middleware/errorHandler.js';

const storage = multer.memoryStorage();
export const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

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

  res.json({ keystore: { id: ks._id, projectId: ks.projectId, projectName: ks.projectName, filename: ks.originalFilename, uploadedAt: ks.uploadedAt } });
}

export async function getKeystore(req, res) {
  const { projectId } = req.params;
  const ks = await Keystore.findOne({ userId: req.user._id, projectId: String(projectId) });
  if (!ks) return res.json({ keystore: null });
  res.json({ keystore: { id: ks._id, projectId: ks.projectId, projectName: ks.projectName, filename: ks.originalFilename, uploadedAt: ks.updatedAt, firebaseAppId: ks.firebaseAppId, firebaseCliToken: ks.firebaseCliToken } });
}

export async function listKeystores(req, res) {
  const ks = await Keystore.find({ userId: req.user._id }).select('-keystorePassword -keyPassword');
  res.json({ keystores: ks });
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
import multer from 'multer';
import AppleCredential from '../models/AppleCredential.js';
import { uploadBufferToS3, getPresignedDownloadUrl, deleteFromS3 } from '../services/s3Service.js';
import { AppError } from '../middleware/errorHandler.js';

const storage = multer.memoryStorage();
export const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // Keys are very small (~1-2KB)

export async function uploadAppleCredentials(req, res) {
  if (!req.file) throw new AppError('No .p8 key file provided', 400);
  const { projectId, projectName, apiKeyId, apiIssuer } = req.body;

  if (!projectId || !apiKeyId || !apiIssuer) {
    throw new AppError('Missing required credential parameters (projectId, apiKeyId, apiIssuer)', 400);
  }

  const projectIdStr = String(projectId);
  const s3Key = `apple-keys/${req.user._id}/${projectIdStr}/${Date.now()}_${req.file.originalname}`;
  
  // Upload .p8 key buffer securely to S3
  await uploadBufferToS3({ key: s3Key, buffer: req.file.buffer, contentType: 'application/octet-stream' });

  // Update or save key details in MongoDB
  const creds = await AppleCredential.findOneAndUpdate(
    { userId: req.user._id, projectId: projectIdStr },
    { 
      projectName, 
      apiKeyId, 
      apiIssuer, 
      p8KeyS3Key: s3Key, 
      originalFilename: req.file.originalname 
    },
    { upsert: true, new: true }
  );

  res.json({
    credentials: {
      id: creds._id,
      projectId: creds.projectId,
      projectName: creds.projectName,
      apiKeyId: creds.apiKeyId,
      apiIssuer: creds.apiIssuer,
      filename: creds.originalFilename,
      createdAt: creds.createdAt,
      updatedAt: creds.updatedAt,
      uploadedAt: creds.createdAt,
    }
  });
}

export async function getAppleCredentials(req, res) {
  const { projectId } = req.params;
  if (!projectId) throw new AppError('Missing projectId parameter', 400);

  const creds = await AppleCredential.findOne({ userId: req.user._id, projectId: String(projectId) });
  if (!creds) return res.json({ credentials: null });

  res.json({
    credentials: {
      id: creds._id,
      projectId: creds.projectId,
      projectName: creds.projectName,
      apiKeyId: creds.apiKeyId,
      apiIssuer: creds.apiIssuer,
      filename: creds.originalFilename,
      createdAt: creds.createdAt,
      updatedAt: creds.updatedAt,
      uploadedAt: creds.createdAt,
    }
  });
}

export async function downloadAppleCredentials(req, res) {
  const { projectId } = req.params;
  if (!projectId) throw new AppError('Missing projectId parameter', 400);

  const creds = await AppleCredential.findOne({ userId: req.user._id, projectId: String(projectId) });
  if (!creds || !creds.p8KeyS3Key) throw new AppError('No Apple credentials found for this project', 404);

  const filename = creds.originalFilename || `AuthKey_${creds.apiKeyId}.p8`;
  const url = await getPresignedDownloadUrl(creds.p8KeyS3Key, filename);
  res.json({ url, filename });
}

export async function deleteAppleCredentials(req, res) {
  const { projectId } = req.params;
  if (!projectId) throw new AppError('Missing projectId parameter', 400);

  const creds = await AppleCredential.findOne({ userId: req.user._id, projectId: String(projectId) });
  if (!creds) throw new AppError('No Apple credentials found for this project', 404);

  if (creds.p8KeyS3Key) {
    await deleteFromS3(creds.p8KeyS3Key);
  }
  await AppleCredential.deleteOne({ _id: creds._id });
  res.json({ success: true });
}

import mongoose from 'mongoose';

const appleCredentialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: String, required: true },
  projectName: String,
  apiKeyId: { type: String, required: true },
  apiIssuer: { type: String, required: true },
  p8KeyS3Key: { type: String, required: true },
  originalFilename: String,
}, { timestamps: true });

appleCredentialSchema.index({ userId: 1, projectId: 1 }, { unique: true });
export default mongoose.model('AppleCredential', appleCredentialSchema);

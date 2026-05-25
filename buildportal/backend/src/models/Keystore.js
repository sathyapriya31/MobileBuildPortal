import mongoose from 'mongoose';

const keystoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: String, required: true },
  projectName: String,
  provider: { type: String, enum: ['github', 'gitlab'] },
  keystoreS3Key: String,
  keystoreAlias: String,
  keystorePassword: String,  // Encrypt in prod with KMS
  keyPassword: String,
  originalFilename: String,
}, { timestamps: true });

keystoreSchema.index({ userId: 1, projectId: 1 }, { unique: true });
export default mongoose.model('Keystore', keystoreSchema);
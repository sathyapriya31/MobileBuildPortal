import mongoose from 'mongoose';

const buildSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: String, required: true },
  projectName: { type: String, required: true },
  repoUrl: { type: String, required: true },
  provider: { type: String, enum: ['github', 'gitlab'], required: true },
  branch: { type: String, required: true },
  platform: { type: String, enum: ['android', 'ios', 'both'], required: true },
  androidFormat: { type: String, enum: ['apk', 'aab'], default: 'apk' },
  versionName: { type: String, default: '1.0.0' },
  buildType: { type: String, enum: ['testing', 'uat', 'production'], default: 'testing' },
  buildNumber: Number,
  status: {
    type: String,
    enum: ['queued', 'building', 'success', 'failed', 'cancelled'],
    default: 'queued',
  },
  logs: [{ timestamp: Date, level: { type: String, default: 'info' }, message: String }],
  artifacts: {
    android: { apkUrl: String, s3Key: String, presignedUrl: String, size: Number },
    ios: { ipaUrl: String, s3Key: String, presignedUrl: String, testFlightLink: String, size: Number },
  },
  slackMessageTs: String,
  startedAt: Date,
  finishedAt: Date,
  duration: Number,
  buildMetadata: { appVersion: String, buildNumber: String, commitSha: String, commitMessage: String },
  error: String,
}, { timestamps: true });

buildSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.model('Build', buildSchema);
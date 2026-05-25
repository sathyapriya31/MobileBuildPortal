import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: String,
  email: String,
  avatar: String,
  provider: { type: String, enum: ['github', 'gitlab'], required: true },
  providerId: { type: String, required: true },
  accessToken: String,
  refreshToken: String,
  gitlabUrl: { type: String, default: 'https://gitlab.com' },
}, { timestamps: true });

userSchema.index({ provider: 1, providerId: 1 }, { unique: true });
export default mongoose.model('User', userSchema);
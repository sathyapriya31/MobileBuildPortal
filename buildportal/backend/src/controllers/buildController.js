import Build from '../models/Build.js';
import Keystore from '../models/Keystore.js';
import { enqueueBuild } from '../services/buildQueue.js';
import { AppError } from '../middleware/errorHandler.js';

let buildCounter = 1000;

export async function triggerBuild(req, res) {
  const { projectId, projectName, repoUrl, provider, branch, platform, androidFormat, versionName, buildType } = req.body;

  if (!projectId || !projectName || !repoUrl || !provider || !branch || !platform) {
    throw new AppError('Missing required build parameters', 400);
  }

  // Keystore is optional when using GitHub Actions — GHA workflows handle signing via repo secrets.
  // We still look it up so the agent/GHA dispatcher can attach it if available.

  const build = await Build.create({
    userId: req.user._id,
    projectId,
    projectName,
    repoUrl,
    provider,
    branch,
    platform,
    androidFormat: (platform === 'android' || platform === 'both') ? (androidFormat || 'apk') : undefined,
    versionName: versionName || '1.0.0',
    buildType: buildType || 'testing',
    buildNumber: ++buildCounter,
    status: 'queued',
    logs: [{ timestamp: new Date(), level: 'info', message: 'Build queued' }],
  });

  await enqueueBuild(String(build._id));

  res.status(201).json({ build });
}

export async function getBuildHistory(req, res) {
  const { page = 1, limit = 20, projectId, projectName, status, platform, date } = req.query;
  const filter = { userId: req.user._id };

  if (projectId) filter.projectId = projectId;

  if (projectName) {
    filter.projectName = { $regex: projectName, $options: 'i' };
  }

  if (status && status !== 'all') {
    if (status.toLowerCase() === 'running') {
      filter.status = 'building';
    } else {
      filter.status = status.toLowerCase();
    }
  }

  if (platform && platform !== 'all') {
    filter.platform = platform.toLowerCase();
  }

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }

  const [builds, total] = await Promise.all([
    Build.find(filter)
      .populate('userId', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Build.countDocuments(filter),
  ]);

  res.json({ builds, total, page: Number(page), pages: Math.ceil(total / limit) });
}

export async function getBuildById(req, res) {
  const build = await Build.findOne({ _id: req.params.id, userId: req.user._id });
  if (!build) throw new AppError('Build not found', 404);
  res.json({ build });
}

export async function cancelBuild(req, res) {
  const build = await Build.findOne({ _id: req.params.id, userId: req.user._id });
  if (!build) throw new AppError('Build not found', 404);
  if (!['queued', 'building'].includes(build.status)) {
    throw new AppError('Build cannot be cancelled in current state', 400);
  }
  build.status = 'cancelled';
  build.finishedAt = new Date();
  await build.save();
  res.json({ build });
}
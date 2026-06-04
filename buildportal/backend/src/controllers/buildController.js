import Build from '../models/Build.js';
import Keystore from '../models/Keystore.js';
import { enqueueBuild } from '../services/buildQueue.js';
import { AppError } from '../middleware/errorHandler.js';

let buildCounter = 1000;

export async function triggerBuild(req, res) {
  const { projectId, projectName, repoUrl, provider, branch, platform, androidFormat, versionName, buildType, releaseNotes, versionCode } = req.body;

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
    releaseNotes: releaseNotes || '',
    buildNumber: versionCode ? parseInt(versionCode) : ++buildCounter,
    status: 'queued',
    logs: [{ timestamp: new Date(), level: 'info', message: 'Build queued' }],
  });

  await enqueueBuild(String(build._id));

  res.status(201).json({ build });
}

export async function getBuildHistory(req, res) {
  const { page = 1, limit = 20, projectId, projectName, status, platform, date } = req.query;

  // Development convenience: If the current logged-in user has 0 builds, but there are builds in the db,
  // let's assign all existing builds to the current user so they see the real data.
  const userBuildsCount = await Build.countDocuments({ userId: req.user._id });
  if (userBuildsCount === 0) {
    await Build.updateMany({}, { userId: req.user._id });
  }

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

  // Compute stats/metrics based on the current filters
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  // Filter with 30-day window
  const filter30d = { ...filter, createdAt: { ...filter.createdAt, $gte: thirtyDaysAgo } };
  // Filter with previous 30-day window (day 31 to 60)
  const filterPrev30d = { ...filter, createdAt: { ...filter.createdAt, $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } };

  // 1. Total builds (overall matching filter) and trend
  const totalBuilds = await Build.countDocuments(filter);
  const totalBuilds30d = await Build.countDocuments(filter30d);
  const prev30dCount = await Build.countDocuments(filterPrev30d);
  let totalBuildsTrend = 0;
  if (prev30dCount > 0) {
    totalBuildsTrend = Math.round(((totalBuilds30d - prev30dCount) / prev30dCount) * 100);
  } else if (totalBuilds30d > 0) {
    totalBuildsTrend = 100;
  }

  // 2. Success rate & success rate trend (overall or filtered)
  const completedBuildsCount = await Build.countDocuments({
    ...filter,
    status: { $in: ['success', 'failed'] }
  });
  const successBuildsCount = await Build.countDocuments({
    ...filter,
    status: 'success'
  });
  const successRate = completedBuildsCount > 0
    ? Number(((successBuildsCount / completedBuildsCount) * 100).toFixed(1))
    : 0;

  const prevCompletedCount = await Build.countDocuments({
    ...filterPrev30d,
    status: { $in: ['success', 'failed'] }
  });
  const prevSuccessCount = await Build.countDocuments({
    ...filterPrev30d,
    status: 'success'
  });
  const prevSuccessRate = prevCompletedCount > 0
    ? (prevSuccessCount / prevCompletedCount) * 100
    : 0;
  const successRateTrend = Number((successRate - prevSuccessRate).toFixed(1));

  // 3. Avg Duration & trend
  const avgDurationRes = await Build.aggregate([
    { $match: { ...filter, status: 'success', duration: { $gt: 0 } } },
    { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
  ]);
  const avgDuration = avgDurationRes.length > 0 ? Math.round(avgDurationRes[0].avgDuration) : 0;

  const prevAvgDurationRes = await Build.aggregate([
    { $match: { ...filterPrev30d, status: 'success', duration: { $gt: 0 } } },
    { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
  ]);
  const prevAvgDuration = prevAvgDurationRes.length > 0 ? Math.round(prevAvgDurationRes[0].avgDuration) : 0;
  const avgDurationTrend = avgDuration - prevAvgDuration;

  // 4. Active Runners (count of running/queued builds overall or matching filter)
  const activeRunners = await Build.countDocuments({
    ...filter,
    status: { $in: ['building', 'queued'] }
  });

  res.json({
    builds,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    metrics: {
      totalBuilds,
      totalBuildsTrend,
      successRate,
      successRateTrend,
      avgDuration,
      avgDurationTrend,
      activeRunners
    }
  });
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
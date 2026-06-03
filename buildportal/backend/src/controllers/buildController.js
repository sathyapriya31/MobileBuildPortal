import Build from '../models/Build.js';
import Keystore from '../models/Keystore.js';
import { enqueueBuild } from '../services/buildQueue.js';
import { AppError } from '../middleware/errorHandler.js';
import { parseRepoUrl } from '../services/xcodeCloudService.js';
import { io } from '../server.js';
import axios from 'axios';

let buildCounter = 1000;

export async function triggerBuild(req, res) {
  const { projectId, projectName, repoUrl, provider, branch, platform, androidFormat, versionName, versionCode, buildType, releaseNotes } = req.body;

  if (!projectId || !projectName || !repoUrl || !provider || !branch || !platform) {
    throw new AppError('Missing required build parameters', 400);
  }

  let resolvedBuildNumber;
  if ((platform === 'android' || platform === 'both') && versionCode) {
    const parsed = parseInt(versionCode, 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new AppError('Version code must be a positive integer', 400);
    }
    resolvedBuildNumber = parsed;
  } else {
    // Dynamically compute the next build number by checking the highest buildNumber in the database
    const lastBuild = await Build.findOne({}).sort({ buildNumber: -1 });
    const highestDbNumber = lastBuild && lastBuild.buildNumber ? lastBuild.buildNumber : 1000;
    buildCounter = Math.max(highestDbNumber, buildCounter) + 1;
    resolvedBuildNumber = buildCounter;
  }

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
    buildNumber: resolvedBuildNumber,
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
  const build = await Build.findOne({ _id: req.params.id, userId: req.user._id }).populate('userId');
  if (!build) throw new AppError('Build not found', 404);
  if (!['queued', 'building'].includes(build.status)) {
    throw new AppError('Build cannot be cancelled in current state', 400);
  }

  build.status = 'cancelled';
  build.finishedAt = new Date();
  build.duration = build.startedAt ? Math.floor((new Date() - build.startedAt) / 1000) : 0;
  await build.save();

  // Try to cancel the run in GitHub Actions if provider is GitHub and platform is Android/both
  if (build.provider === 'github' && (build.platform === 'android' || build.platform === 'both')) {
    const token = build.userId?.accessToken || req.user.accessToken;
    
    if (token) {
      try {
        const { path: repoPath } = parseRepoUrl(build.repoUrl);
        const [owner, repo] = repoPath.split('/');
        
        let runId = build.githubRunId;
        
        // Fallback: If runId is not yet registered (still queued or initializing)
        if (!runId) {
          const workflowFile = 'buildportal-android.yml';
          const runsRes = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?branch=${encodeURIComponent(build.branch)}`,
            {
              headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'BuildPortal',
              },
            }
          );
          const runs = runsRes.data?.workflow_runs || [];
          // Find the latest active (queued/in_progress) run
          const activeRun = runs.find(r => ['queued', 'in_progress'].includes(r.status));
          if (activeRun) {
            runId = String(activeRun.id);
            build.githubRunId = runId;
            await build.save();
          }
        }
        
        if (runId) {
          await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/cancel`,
            {},
            {
              headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'BuildPortal',
              },
            }
          );
          
          build.logs.push({
            timestamp: new Date(),
            level: 'info',
            message: `🛑 Successfully requested cancellation of GitHub Actions workflow run ${runId}.`
          });
          await build.save();
        } else {
          build.logs.push({
            timestamp: new Date(),
            level: 'warn',
            message: `⚠️ Could not find an active GitHub Actions run to cancel.`
          });
          await build.save();
        }
      } catch (err) {
        console.error('Error cancelling GitHub Actions run:', err.response?.data || err.message);
        build.logs.push({
          timestamp: new Date(),
          level: 'error',
          message: `❌ Failed to cancel GitHub Actions run: ${err.response?.data?.message || err.message}`
        });
        await build.save();
      }
    }
  }

  // Emit real-time log/status updates via Socket.IO
  io.to(`build:${build._id}`).emit('build:complete', {
    buildId: String(build._id),
    status: 'cancelled',
    artifacts: build.artifacts,
    duration: build.duration
  });

  io.to(`build:${build._id}`).emit('build:log', {
    buildId: String(build._id),
    level: 'info',
    message: '🛑 Build cancelled by user.',
    timestamp: new Date()
  });

  res.json({ build });
}
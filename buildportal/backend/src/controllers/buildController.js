import axios from 'axios';
import Build from '../models/Build.js';
import Keystore from '../models/Keystore.js';
import { enqueueBuild } from '../services/buildQueue.js';
import { AppError } from '../middleware/errorHandler.js';
import { io } from '../server.js';
import { parseRepoUrl } from '../services/xcodeCloudService.js';

let buildCounter = 1000;

export async function triggerBuild(req, res) {
  const { projectId, projectName, repoUrl, provider, branch, platform, androidFormat, versionName, buildType, buildNumber } = req.body;

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
    buildNumber: buildNumber ? parseInt(buildNumber) : ++buildCounter,
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

  const buildId = String(build._id);

  if (build.provider === 'github' && (build.platform === 'android' || build.platform === 'both')) {
    try {
      const user = req.user;
      if (user && user.accessToken) {
        const { path: repoPath } = parseRepoUrl(build.repoUrl);
        const [owner, repo] = repoPath.split('/');
        if (owner && repo) {
          const workflowFile = 'buildportal-android.yml';

          build.logs.push({ timestamp: new Date(), level: 'info', message: '🔍 Contacting GitHub to cancel active build workflow...' });
          io.to(`build:${buildId}`).emit('build:log', {
            buildId,
            level: 'info',
            message: '🔍 Contacting GitHub to cancel active build workflow...',
            timestamp: new Date(),
          });

          // Fetch runs of the specific workflow file on the target branch
          const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?branch=${encodeURIComponent(build.branch)}`,
            {
              headers: {
                Authorization: `token ${user.accessToken}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'BuildPortal',
              },
            }
          );

          const runs = response.data.workflow_runs || [];
          const activeRuns = runs.filter(run =>
            ['queued', 'in_progress', 'requested', 'waiting', 'pending'].includes(run.status)
          );

          if (activeRuns.length > 0) {
            for (const run of activeRuns) {
              build.logs.push({ timestamp: new Date(), level: 'info', message: `🛑 Cancelling GitHub Action workflow run: ID ${run.id}` });
              io.to(`build:${buildId}`).emit('build:log', {
                buildId,
                level: 'info',
                message: `🛑 Cancelling GitHub Action workflow run: ID ${run.id}`,
                timestamp: new Date(),
              });

              await axios.post(
                `https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}/cancel`,
                {},
                {
                  headers: {
                    Authorization: `token ${user.accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                    'User-Agent': 'BuildPortal',
                  },
                }
              );
            }
            build.logs.push({ timestamp: new Date(), level: 'info', message: `✅ Successfully cancelled ${activeRuns.length} active GitHub workflow run(s).` });
            io.to(`build:${buildId}`).emit('build:log', {
              buildId,
              level: 'info',
              message: `✅ Successfully cancelled ${activeRuns.length} active GitHub workflow run(s).`,
              timestamp: new Date(),
            });
          } else {
            build.logs.push({ timestamp: new Date(), level: 'warn', message: '⚠️ No active GitHub Action workflow runs found for this branch.' });
            io.to(`build:${buildId}`).emit('build:log', {
              buildId,
              level: 'warn',
              message: '⚠️ No active GitHub Action workflow runs found for this branch.',
              timestamp: new Date(),
            });
          }
        }
      } else {
        build.logs.push({ timestamp: new Date(), level: 'warn', message: '⚠️ GitHub access token missing. Skipping GitHub Action cancellation.' });
        io.to(`build:${buildId}`).emit('build:log', {
          buildId,
          level: 'warn',
          message: '⚠️ GitHub access token missing. Skipping GitHub Action cancellation.',
          timestamp: new Date(),
        });
      }
    } catch (err) {
      console.error('Failed to cancel GitHub Action workflow run:', err.message);
      build.logs.push({ timestamp: new Date(), level: 'error', message: `❌ Failed to cancel GitHub Action workflow run: ${err.message}` });
      io.to(`build:${buildId}`).emit('build:log', {
        buildId,
        level: 'error',
        message: `❌ Failed to cancel GitHub Action workflow run: ${err.message}`,
        timestamp: new Date(),
      });
    }
  }

  build.status = 'cancelled';
  build.finishedAt = new Date();
  build.logs.push({ timestamp: new Date(), level: 'info', message: 'Build status set to CANCELED.' });
  await build.save();

  // Notify frontend of status change
  io.to(`build:${buildId}`).emit('build:status', { buildId, status: 'cancelled' });

  res.json({ build });
}
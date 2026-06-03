import { Router } from 'express';
import multer from 'multer';
import { unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { uploadToS3 } from '../services/s3Service.js';
import Build from '../models/Build.js';
import { notifySlack } from '../services/slackService.js';
import { getPresignedUrl } from '../services/s3Service.js';
import { io } from '../server.js';

import Keystore from '../models/Keystore.js';
import { getObjectFromS3 } from '../services/s3Service.js';

const router = Router();

// ══════════════════════════════════════════════════════════════════════════════════════
// ██  MAC MINI AGENT ROUTES  ──  COMMENTED OUT (Android now runs on GitHub Actions)  ██
// ══════════════════════════════════════════════════════════════════════════════════════

const uploadDir = join(process.cwd(), 'uploads');
try { mkdirSync(uploadDir, { recursive: true }); } catch (e) {}
const upload = multer({ dest: 'uploads/' });

// ── GET /api/agent/keystore/:buildId ─────────────────────────────────────────────────
// Securely streams the Android keystore file to the GitHub Actions runner.
// Also supports the GHA constructed path suffix: /github-actions/callback/keystore/:buildId
// ─────────────────────────────────────────────────────────────────────────────────────
router.get(['/keystore/:buildId', '/github-actions/callback/keystore/:buildId'], async (req, res) => {
  const { secret } = req.query;
  const { buildId } = req.params;
  if (secret !== process.env.GITHUB_ACTIONS_CALLBACK_SECRET && secret !== process.env.BUILD_AGENT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const build = await Build.findById(buildId);
    if (!build) return res.status(404).json({ error: 'Build not found' });
    const ks = await Keystore.findOne({ userId: build.userId, projectId: build.projectId });
    if (!ks) return res.status(404).json({ error: 'Keystore not found' });
    const s3Stream = await getObjectFromS3(ks.keystoreS3Key);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${ks.originalFilename || 'release.keystore'}"`);
    s3Stream.pipe(res);
  } catch (err) {
    console.error('Error streaming keystore:', err);
    res.status(500).json({ error: `Failed to stream keystore: ${err.message}` });
  }
});

// ── POST /api/agent/upload ────────────────────────────────────────────────────────────
// Receives a multipart APK/IPA upload from the Mac Mini Agent and stores it in S3.
// No longer needed — GitHub Actions uploads directly to S3 via AWS CLI.
// ─────────────────────────────────────────────────────────────────────────────────────
// router.post('/upload', upload.single('file'), async (req, res) => {
//   const { secret, buildId, platform } = req.body;
//   if (secret !== process.env.BUILD_AGENT_SECRET) {
//     if (req.file) { try { unlinkSync(req.file.path); } catch {} }
//     return res.status(403).json({ error: 'Forbidden' });
//   }
//   if (!buildId || !platform || !req.file) {
//     if (req.file) { try { unlinkSync(req.file.path); } catch {} }
//     return res.status(400).json({ error: 'Missing required parameters or file' });
//   }
//   try {
//     const build = await Build.findById(buildId);
//     if (!build) {
//       try { unlinkSync(req.file.path); } catch {}
//       return res.status(404).json({ error: 'Build not found' });
//     }
//     const s3Key = `builds/${buildId}/${platform}/${req.file.originalname}`;
//     const contentType = platform === 'android' ? 'application/vnd.android.package-archive' : 'application/octet-stream';
//     const s3Url = await uploadToS3({ key: s3Key, filePath: req.file.path, contentType });
//     const presignedUrl = await getPresignedUrl(s3Key, 86400);
//     if (platform === 'android') {
//       build.artifacts.android = { apkUrl: s3Url, s3Key, presignedUrl, size: req.file.size };
//     } else if (platform === 'ios') {
//       build.artifacts.ios = { ipaUrl: s3Url, s3Key, presignedUrl, size: req.file.size };
//     }
//     await build.save();
//     try { unlinkSync(req.file.path); } catch {}
//     res.json({ success: true, s3Key, presignedUrl });
//   } catch (err) {
//     console.error('Error uploading artifact:', err);
//     if (req.file) { try { unlinkSync(req.file.path); } catch {} }
//     res.status(500).json({ error: `Upload failed: ${err.message}` });
//   }
// });

// ── POST /api/agent/callback ──────────────────────────────────────────────────────────
// Mac Mini agent posts build results here.
// No longer needed — GitHub Actions uses /api/agent/github-actions/callback instead.
// ─────────────────────────────────────────────────────────────────────────────────────
// router.post('/callback', async (req, res) => {
//   const { secret, buildId, status, logs, artifacts, error, commitSha, commitMessage, appVersion } = req.body;
//   if (secret !== process.env.BUILD_AGENT_SECRET) {
//     return res.status(403).json({ error: 'Forbidden' });
//   }
//   const build = await Build.findById(buildId);
//   if (!build) return res.status(404).json({ error: 'Build not found' });
//   build.status = status;
//   build.finishedAt = new Date();
//   build.duration = build.startedAt ? Math.floor((new Date() - build.startedAt) / 1000) : 0;
//   build.error = error;
//   build.buildMetadata = { commitSha, commitMessage, appVersion };
//   if (logs?.length) {
//     build.logs.push(...logs.map(l => {
//       let parsedDate = l.timestamp ? new Date(l.timestamp) : new Date();
//       if (isNaN(parsedDate.getTime())) parsedDate = new Date();
//       return { timestamp: parsedDate, level: l.level || 'info', message: l.message };
//     }));
//   }
//   if (artifacts?.android?.s3Key) {
//     const presignedUrl = await getPresignedUrl(artifacts.android.s3Key, 86400);
//     build.artifacts.android = { ...artifacts.android, presignedUrl };
//   }
//   if (artifacts?.ios?.s3Key) {
//     const presignedUrl = await getPresignedUrl(artifacts.ios.s3Key, 86400);
//     build.artifacts.ios = { ...artifacts.ios, presignedUrl };
//   }
//   if (build.artifacts?.android?.s3Key) {
//     const presignedUrl = await getPresignedUrl(build.artifacts.android.s3Key, 86400);
//     build.artifacts.android.presignedUrl = presignedUrl;
//     if (!build.slackMessageTs) {
//       const ts = await notifySlack({ buildId, projectName: build.projectName, branch: build.branch, platform: build.platform, s3Link: presignedUrl });
//       build.slackMessageTs = ts;
//     }
//   }
//   if (build.artifacts?.ios?.s3Key) {
//     const presignedUrl = await getPresignedUrl(build.artifacts.ios.s3Key, 86400);
//     build.artifacts.ios.presignedUrl = presignedUrl;
//   }
//   await build.save();
//   io.to(`build:${buildId}`).emit('build:complete', { buildId, status, artifacts: build.artifacts, duration: build.duration });
//   res.json({ received: true });
// });

// ── POST /api/agent/log ───────────────────────────────────────────────────────────────
// Mac Mini agent streams individual log lines here.
// No longer needed — GitHub Actions builds report back in a single callback.
// ─────────────────────────────────────────────────────────────────────────────────────
// router.post('/log', async (req, res) => {
//   const { secret, buildId, level, message } = req.body;
//   if (secret !== process.env.BUILD_AGENT_SECRET) return res.status(403).json({ error: 'Forbidden' });
//   const build = await Build.findById(buildId);
//   if (!build) return res.status(404).json({ error: 'Build not found' });
//   build.logs.push({ timestamp: new Date(), level: level || 'info', message });
//   await build.save();
//   io.to(`build:${buildId}`).emit('build:log', { buildId, level, message, timestamp: new Date() });
//   res.json({ ok: true });
// });

/**
 * POST /api/agent/github-actions/upload
 *
 * Receives multipart build artifact from GitHub Actions and uploads to AWS S3 securely.
 * Secured with GITHUB_ACTIONS_CALLBACK_SECRET.
 */
router.post('/github-actions/upload', upload.single('file'), async (req, res) => {
  const { secret, buildId } = req.body;

  if (secret !== process.env.GITHUB_ACTIONS_CALLBACK_SECRET) {
    if (req.file) { try { unlinkSync(req.file.path); } catch {} }
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!buildId || !req.file) {
    if (req.file) { try { unlinkSync(req.file.path); } catch {} }
    return res.status(400).json({ error: 'Missing required parameters or file' });
  }

  try {
    const build = await Build.findById(buildId);
    if (!build) {
      try { unlinkSync(req.file.path); } catch {}
      return res.status(404).json({ error: 'Build not found' });
    }

    const s3Key = `builds/${buildId}/android/${req.file.originalname}`;
    const isAab = req.file.originalname.endsWith('.aab');
    const contentType = isAab ? 'application/octet-stream' : 'application/vnd.android.package-archive';

    const s3Url = await uploadToS3({ key: s3Key, filePath: req.file.path, contentType });
    const presignedUrl = await getPresignedUrl(s3Key, 86400);

    if (!build.artifacts.android) {
      build.artifacts.android = {};
    }

    if (isAab) {
      build.artifacts.android.aabUrl = s3Url;
      build.artifacts.android.aabS3Key = s3Key;
      build.artifacts.android.aabPresignedUrl = presignedUrl;
      build.artifacts.android.aabSize = req.file.size;
    } else {
      build.artifacts.android.apkUrl = s3Url;
      build.artifacts.android.s3Key = s3Key;
      build.artifacts.android.presignedUrl = presignedUrl;
      build.artifacts.android.size = req.file.size;
    }

    await build.save();
    try { unlinkSync(req.file.path); } catch {}

    res.json({ success: true, s3Key, presignedUrl });
  } catch (err) {
    console.error('Error uploading artifact:', err);
    if (req.file) { try { unlinkSync(req.file.path); } catch {} }
    res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
});

// ══════════════════════════════════════════════════════════════════════════════════════
// ██  GITHUB ACTIONS CALLBACK  ──  Active Android build result receiver               ██
// ══════════════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/agent/github-actions/callback/run-id
 *
 * Called by the GitHub Actions workflow at the beginning of the build to register the workflow run ID.
 * Secured with GITHUB_ACTIONS_CALLBACK_SECRET.
 *
 * Body: { secret, buildId, runId }
 */
router.post('/github-actions/callback/run-id', async (req, res) => {
  const { secret, buildId, runId } = req.body;

  if (secret !== process.env.GITHUB_ACTIONS_CALLBACK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const build = await Build.findById(buildId);
    if (!build) return res.status(404).json({ error: 'Build not found' });

    build.githubRunId = String(runId);
    build.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: `Registered GitHub Actions Workflow Run ID: ${runId}`
    });
    await build.save();

    // Stream log to frontend in real-time
    io.to(`build:${buildId}`).emit('build:log', {
      buildId,
      level: 'info',
      message: `Registered GitHub Actions Workflow Run ID: ${runId}`,
      timestamp: new Date()
    });

    res.json({ registered: true });
  } catch (err) {
    console.error('Error registering GHA workflow run ID:', err);
    res.status(500).json({ error: `Registration failed: ${err.message}` });
  }
});

/**
 * POST /api/agent/github-actions/callback
 *
 * Called by the GitHub Actions workflow at the end of every Android build.
 * Secured with GITHUB_ACTIONS_CALLBACK_SECRET.
 *
 * Body: { secret, buildId, status, s3Key, commitSha, commitMessage, error }
 */
router.post('/github-actions/callback', async (req, res) => {
  const { secret, buildId, status, error, commitSha, commitMessage, s3Key, buildNumber } = req.body;

  if (secret !== process.env.GITHUB_ACTIONS_CALLBACK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const build = await Build.findById(buildId);
  if (!build) return res.status(404).json({ error: 'Build not found' });

  // If the build was already cancelled by the user, ignore any late callbacks
  if (build.status === 'cancelled') {
    return res.json({ received: true, message: 'Build was already cancelled by user.' });
  }

  build.status = status; // 'success' or 'failed'
  build.finishedAt = new Date();
  build.duration = build.startedAt ? Math.floor((new Date() - build.startedAt) / 1000) : 0;
  build.error = error || null;
  build.buildMetadata = { commitSha: commitSha || '', commitMessage: commitMessage || '' };
  
  if (buildNumber) {
    build.buildNumber = Number(buildNumber);
  }

  // Record the artifact uploaded to S3 by the GitHub Actions runner
  if (status === 'success') {
    let slackS3Link = '';
    
    if (build.artifacts.android) {
      if (build.artifacts.android.s3Key) {
        build.artifacts.android.presignedUrl = await getPresignedUrl(build.artifacts.android.s3Key, 86400);
        slackS3Link = build.artifacts.android.presignedUrl;
      }
      if (build.artifacts.android.aabS3Key) {
        build.artifacts.android.aabPresignedUrl = await getPresignedUrl(build.artifacts.android.aabS3Key, 86400);
        if (!slackS3Link) slackS3Link = build.artifacts.android.aabPresignedUrl;
      }
    } else if (s3Key) {
      const presignedUrl = await getPresignedUrl(s3Key, 86400);
      build.artifacts.android = {
        s3Key,
        presignedUrl,
        size: 0,
      };
      slackS3Link = presignedUrl;
    }

    // Slack notification
    if (!build.slackMessageTs && slackS3Link) {
      try {
        const ts = await notifySlack({
          buildId,
          projectName: build.projectName,
          branch: build.branch,
          platform: build.platform,
          s3Link: slackS3Link,
        });
        build.slackMessageTs = ts;
      } catch (slackErr) {
        console.error('Slack notification failed:', slackErr.message);
      }
    }
  }

  await build.save();

  // Emit real-time update to frontend
  io.to(`build:${buildId}`).emit('build:complete', {
    buildId,
    status,
    artifacts: build.artifacts,
    duration: build.duration,
    error: build.error,
  });

  // Emit a final log entry so the live log panel shows the result
  const logMessage = status === 'success'
    ? '✅ GitHub Actions build completed successfully!'
    : status === 'cancelled'
      ? '🛑 GitHub Actions build was manually cancelled.'
      : `❌ GitHub Actions build failed: ${error || 'Unknown error'}`;
  io.to(`build:${buildId}`).emit('build:log', {
    buildId,
    level: status === 'success' ? 'info' : status === 'cancelled' ? 'warn' : 'error',
    message: logMessage,
    timestamp: new Date(),
  });

  res.json({ received: true });
});

export default router;
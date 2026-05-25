import { Router } from 'express';
import multer from 'multer';
import { unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import Build from '../models/Build.js';
import Keystore from '../models/Keystore.js';
import { notifySlack } from '../services/slackService.js';
import { getPresignedUrl, uploadToS3, getObjectFromS3 } from '../services/s3Service.js';
import { io } from '../server.js';

const router = Router();

// Ensure uploads directory exists
const uploadDir = join(process.cwd(), 'uploads');
try {
  mkdirSync(uploadDir, { recursive: true });
} catch (e) {}

const upload = multer({ dest: 'uploads/' });

// Securely stream the Android keystore file to the Mac Mini Agent
router.get('/keystore/:buildId', async (req, res) => {
  const { secret } = req.query;
  const { buildId } = req.params;

  if (secret !== process.env.BUILD_AGENT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const build = await Build.findById(buildId);
    if (!build) return res.status(404).json({ error: 'Build not found' });

    const ks = await Keystore.findOne({ userId: build.userId, projectId: build.projectId });
    if (!ks) return res.status(404).json({ error: 'Keystore not found' });

    const s3Stream = await getObjectFromS3(ks.keystoreS3Key);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${ks.originalFilename}"`);
    s3Stream.pipe(res);
  } catch (err) {
    console.error('Error streaming keystore:', err);
    res.status(500).json({ error: `Failed to stream keystore: ${err.message}` });
  }
});

// Securely upload build artifacts from the Mac Mini Agent
router.post('/upload', upload.single('file'), async (req, res) => {
  const { secret, buildId, platform } = req.body;

  if (secret !== process.env.BUILD_AGENT_SECRET) {
    if (req.file) {
      try { unlinkSync(req.file.path); } catch {}
    }
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!buildId || !platform || !req.file) {
    if (req.file) {
      try { unlinkSync(req.file.path); } catch {}
    }
    return res.status(400).json({ error: 'Missing required parameters or file' });
  }

  try {
    const build = await Build.findById(buildId);
    if (!build) {
      try { unlinkSync(req.file.path); } catch {}
      return res.status(404).json({ error: 'Build not found' });
    }

    const s3Key = `builds/${buildId}/${platform}/${req.file.originalname}`;
    const contentType = platform === 'android' ? 'application/vnd.android.package-archive' : 'application/octet-stream';

    const s3Url = await uploadToS3({
      key: s3Key,
      filePath: req.file.path,
      contentType
    });

    const presignedUrl = await getPresignedUrl(s3Key, 86400);

    if (platform === 'android') {
      build.artifacts.android = {
        apkUrl: s3Url,
        s3Key,
        presignedUrl,
        size: req.file.size
      };
    } else if (platform === 'ios') {
      build.artifacts.ios = {
        ipaUrl: s3Url,
        s3Key,
        presignedUrl,
        size: req.file.size
      };
    }

    await build.save();

    try { unlinkSync(req.file.path); } catch {}

    res.json({
      success: true,
      s3Key,
      presignedUrl
    });
  } catch (err) {
    console.error('Error uploading artifact:', err);
    if (req.file) {
      try { unlinkSync(req.file.path); } catch {}
    }
    res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
});

// Mac Mini agent posts back results here
router.post('/callback', async (req, res) => {
  const { secret, buildId, status, logs, artifacts, error, commitSha, commitMessage, appVersion } = req.body;

  if (secret !== process.env.BUILD_AGENT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const build = await Build.findById(buildId);
  if (!build) return res.status(404).json({ error: 'Build not found' });

  build.status = status;
  build.finishedAt = new Date();
  build.duration = build.startedAt ? Math.floor((new Date() - build.startedAt) / 1000) : 0;
  build.error = error;
  build.buildMetadata = { commitSha, commitMessage, appVersion };

  if (logs?.length) {
    build.logs.push(...logs.map(l => {
      let parsedDate = l.timestamp ? new Date(l.timestamp) : new Date();
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }
      return {
        timestamp: parsedDate,
        level: l.level || 'info',
        message: l.message
      };
    }));
  }

  // Handle passed in artifacts if any
  if (artifacts?.android?.s3Key) {
    const presignedUrl = await getPresignedUrl(artifacts.android.s3Key, 86400);
    build.artifacts.android = { ...artifacts.android, presignedUrl };
  }

  if (artifacts?.ios?.s3Key) {
    const presignedUrl = await getPresignedUrl(artifacts.ios.s3Key, 86400);
    build.artifacts.ios = { ...artifacts.ios, presignedUrl };
  }

  // Ensure presigned URLs and Slack notifications are triggered for build.artifacts
  if (build.artifacts?.android?.s3Key) {
    const presignedUrl = await getPresignedUrl(build.artifacts.android.s3Key, 86400);
    build.artifacts.android.presignedUrl = presignedUrl;

    if (!build.slackMessageTs) {
      const ts = await notifySlack({
        buildId,
        projectName: build.projectName,
        branch: build.branch,
        platform: build.platform,
        s3Link: presignedUrl,
      });
      build.slackMessageTs = ts;
    }
  }

  if (build.artifacts?.ios?.s3Key) {
    const presignedUrl = await getPresignedUrl(build.artifacts.ios.s3Key, 86400);
    build.artifacts.ios.presignedUrl = presignedUrl;
  }

  await build.save();

  // Emit real-time update
  io.to(`build:${buildId}`).emit('build:complete', {
    buildId,
    status,
    artifacts: build.artifacts,
    duration: build.duration,
  });

  res.json({ received: true });
});

// Stream build logs to frontend via SSE (Mac Mini pushes logs here)
router.post('/log', async (req, res) => {
  const { secret, buildId, level, message } = req.body;
  if (secret !== process.env.BUILD_AGENT_SECRET) return res.status(403).json({ error: 'Forbidden' });

  const build = await Build.findById(buildId);
  if (!build) return res.status(404).json({ error: 'Build not found' });

  build.logs.push({ timestamp: new Date(), level: level || 'info', message });
  await build.save();

  io.to(`build:${buildId}`).emit('build:log', { buildId, level, message, timestamp: new Date() });
  res.json({ ok: true });
});

export default router;
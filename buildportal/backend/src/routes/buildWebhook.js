import { Router } from 'express';
import Build from '../models/Build.js';
import { notifySlack } from '../services/slackService.js';
import { io } from '../server.js';

const router = Router();

// Fastlane webhook endpoint
router.post('/webhook', async (req, res) => {
  const { build_id, status, s3_url, version_code, version_name, error_message } = req.body;
  
  if (!build_id || !status) {
    return res.status(400).json({ error: 'Missing build_id or status' });
  }

  try {
    const build = await Build.findById(build_id);
    if (!build) {
      return res.status(404).json({ error: 'Build not found' });
    }

    build.status = status;
    build.finishedAt = new Date();
    build.duration = build.startedAt ? Math.floor((new Date() - build.startedAt) / 1000) : 0;

    if (status === 'success') {
      build.artifacts.android = {
        apkUrl: s3_url,
        s3Key: '',
        presignedUrl: s3_url,
        size: 0
      };
      
      build.buildMetadata = {
        appVersion: version_name || '1.0.0',
        buildNumber: String(version_code || build.buildNumber)
      };

      build.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `[Fastlane Webhook] Build completed successfully. Version Name: ${version_name || '1.0.0'}, Code: ${version_code || build.buildNumber}`
      });

      if (s3_url) {
        build.logs.push({
          timestamp: new Date(),
          level: 'info',
          message: `[Fastlane Webhook] S3 URL: ${s3_url}`
        });
      }

      // Notify Slack
      try {
        const ts = await notifySlack({
          buildId: String(build._id),
          projectName: build.projectName,
          branch: build.branch,
          platform: build.platform,
          s3Link: s3_url,
        });
        build.slackMessageTs = ts;
      } catch (err) {
        console.error('[Webhook] Slack notification failed:', err.message);
      }
    } else {
      build.error = error_message || 'Fastlane build failed.';
      build.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `[Fastlane Webhook] Build failed: ${error_message || 'Unknown error'}`
      });
    }

    await build.save();

    // Broadcast real-time status update to frontend
    io.to(`build:${build_id}`).emit('build:complete', {
      buildId: build_id,
      status,
      artifacts: build.artifacts,
      duration: build.duration,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Webhook] Processing error:', err);
    res.status(500).json({ error: `Internal server error: ${err.message}` });
  }
});

export default router;

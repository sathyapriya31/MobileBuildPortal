import Bull from 'bull';
import axios from 'axios';
import Build from '../models/Build.js';
import Keystore from '../models/Keystore.js';
import { notifySlack } from './slackService.js';
import { getPresignedUrl } from './s3Service.js';

let buildQueue;

export async function setupBuildQueue(io) {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const queueOptions = {
    defaultJobOptions: { attempts: 1, removeOnComplete: 50, removeOnFail: 100 },
  };

  if (redisUrl.startsWith('rediss://')) {
    queueOptions.redis = {
      tls: {
        rejectUnauthorized: false
      }
    };
  }

  buildQueue = new Bull('build-queue', redisUrl, queueOptions);

  buildQueue.on('error', (err) => {
    console.error('❌ Build queue redis error:', err.message);
  });

  buildQueue.process(async (job) => {
    const { buildId } = job.data;
    const build = await Build.findById(buildId);
    if (!build) return;

    build.status = 'building';
    build.startedAt = new Date();
    await build.save();
    io.to(`build:${buildId}`).emit('build:status', { buildId, status: 'building' });

    try {
      // Fetch keystore for Android builds
      let keystorePayload = null;
      if (build.platform === 'android' || build.platform === 'both') {
        const ks = await Keystore.findOne({ userId: build.userId, projectId: build.projectId });
        if (ks) {
          keystorePayload = {
            hasKeystore: true,
            alias: ks.keystoreAlias,
            password: ks.keystorePassword,
            keyPassword: ks.keyPassword,
            filename: ks.originalFilename,
            firebaseAppId: ks.firebaseAppId || '',
            firebaseCliToken: ks.firebaseCliToken || '',
          };
          addLog(build, 'info', `Attached keystore details for project: ${build.projectName}`);
        } else {
          addLog(build, 'info', `No keystore found for project: ${build.projectName}. Build might be unsigned.`);
        }
      }

      // Dispatch to Mac Mini agent
      const agentPayload = {
        buildId: String(build._id),
        projectId: build.projectId,
        projectName: build.projectName,
        repoUrl: build.repoUrl,
        branch: build.branch,
        platform: build.platform,
        androidFormat: build.androidFormat || 'apk',
        versionCode: build.buildNumber,
        versionName: build.versionName || '1.0.0',
        buildType: build.buildType || 'testing',
        provider: build.provider,
        callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/agent/callback`,
        agentSecret: process.env.BUILD_AGENT_SECRET,
        keystore: keystorePayload,
      };

      await axios.post(
        `http://${process.env.BUILD_AGENT_HOST}:${process.env.BUILD_AGENT_PORT}/build`,
        agentPayload,
        { timeout: 5000 }
      );

      addLog(build, 'info', `Build successfully dispatched to Mac Mini agent`);
      await build.save();
    } catch (err) {
      build.status = 'failed';
      build.error = `Failed to reach Mac Mini agent: ${err.message}`;
      build.finishedAt = new Date();
      await build.save();
      io.to(`build:${buildId}`).emit('build:status', { buildId, status: 'failed', error: build.error });
    }
  });

  buildQueue.on('failed', async (job, err) => {
    console.error('Build job failed:', err.message);
  });

  console.log('✅ Build queue ready');
}

export async function enqueueBuild(buildId) {
  return buildQueue.add({ buildId }, { jobId: buildId });
}

function addLog(build, level, message) {
  build.logs.push({ timestamp: new Date(), level, message });
}
import Bull from 'bull';
import axios from 'axios';
import Build from '../models/Build.js';
import Keystore from '../models/Keystore.js';
import { notifySlack } from './slackService.js';
import { getPresignedUrl } from './s3Service.js';
import { parseYaml } from './yamlParser.js';
import { triggerXcodeCloudBuild, pollXcodeCloudBuild, parseRepoUrl } from './xcodeCloudService.js';

let buildQueue;

/**
 * Fetches the buildportal.yml configuration file directly from GitHub/GitLab repository
 */
async function fetchYamlFromRepo(user, repoUrl, branch) {
  const { path } = parseRepoUrl(repoUrl);
  const fileNames = ['buildportal.yml', '.buildportal.yml', 'spritle.yaml'];
  
  if (user.provider === 'github') {
    const headers = {
      'Authorization': `token ${user.accessToken}`,
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'BuildPortal'
    };
    
    for (const fileName of fileNames) {
      try {
        const res = await axios.get(`https://api.github.com/repos/${path}/contents/${fileName}?ref=${encodeURIComponent(branch)}`, { headers });
        return res.data;
      } catch (err) {
        if (err.response?.status !== 404) {
          throw new Error(`Failed to fetch ${fileName} from GitHub: ${err.message}`);
        }
      }
    }
    throw new Error('No BuildPortal configuration file found. Checked: ' + fileNames.join(', '));
  } else if (user.provider === 'gitlab') {
    const headers = {
      'Authorization': `Bearer ${user.accessToken}`
    };
    
    const gitlabUrl = user.gitlabUrl || process.env.GITLAB_URL || 'https://gitlab.com';
    for (const fileName of fileNames) {
      try {
        const res = await axios.get(`${gitlabUrl}/api/v4/projects/${encodeURIComponent(path)}/repository/files/${encodeURIComponent(fileName)}/raw?ref=${encodeURIComponent(branch)}`, { headers });
        return res.data;
      } catch (err) {
        if (err.response?.status !== 404) {
          throw new Error(`Failed to fetch ${fileName} from GitLab: ${err.message}`);
        }
      }
    }
    throw new Error('No BuildPortal configuration file found. Checked: ' + fileNames.join(', '));
  } else {
    throw new Error(`Unsupported VCS provider: ${user.provider}`);
  }
}

/**
 * Orchestrates an iOS build using Apple Xcode Cloud
 */
async function processXcodeCloudBuild(build, io) {
  const buildId = String(build._id);
  const logCallback = async (level, message) => {
    // Reload build to avoid overwriting parallel saves
    const freshBuild = await Build.findById(buildId);
    if (freshBuild) {
      freshBuild.logs.push({ timestamp: new Date(), level, message });
      await freshBuild.save();
    }
    io.to(`build:${buildId}`).emit('build:log', { buildId, level, message, timestamp: new Date() });
  };

  try {
    const user = build.userId;
    if (!user || !user.accessToken) {
      throw new Error('Associated user is not authenticated or access token is missing.');
    }

    // Step 1: Fetch and parse yaml configuration
    await logCallback('info', 'Fetching BuildPortal YAML configuration file from repository...');
    let rawYaml = '';
    try {
      rawYaml = await fetchYamlFromRepo(user, build.repoUrl, build.branch);
    } catch (fetchErr) {
      await logCallback('warn', `${fetchErr.message} Proceeding with default Xcode Cloud configurations.`);
    }

    let parsedConfig = {};
    if (rawYaml) {
      try {
        parsedConfig = parseYaml(String(rawYaml));
        await logCallback('info', 'Successfully parsed buildportal.yml configuration.');
      } catch (parseErr) {
        await logCallback('warn', `Failed to parse YAML config: ${parseErr.message}. Proceeding with default configurations.`);
      }
    }

    // Step 2: Trigger build on Xcode Cloud
    const triggerResult = await triggerXcodeCloudBuild({
      repoUrl: build.repoUrl,
      branch: build.branch,
      config: parsedConfig
    }, logCallback);

    // Step 3: Start polling
    await logCallback('info', 'Started polling Xcode Cloud build run status...');
    const pollResult = await pollXcodeCloudBuild(triggerResult.buildRunId, logCallback);

    if (pollResult.status === 'success') {
      await logCallback('info', 'Xcode Cloud Build SUCCEEDED!');
      
      const freshBuild = await Build.findById(buildId);
      freshBuild.status = freshBuild.platform === 'both' && freshBuild.status === 'building' 
        ? 'building' // keep building if android is still compiling
        : 'success';
      
      freshBuild.finishedAt = new Date();
      freshBuild.duration = freshBuild.startedAt ? Math.floor((new Date() - freshBuild.startedAt) / 1000) : 0;
      
      const testFlightLink = `https://appstoreconnect.apple.com/apps/${triggerResult.appId}/testflight`;
      freshBuild.artifacts.ios = {
        testFlightLink,
        fileName: `Xcode Cloud Build #${pollResult.buildNumber || ''}`,
        size: 0
      };
      
      await freshBuild.save();
      await logCallback('info', `TestFlight Link generated and saved: ${testFlightLink}`);

      // Emit complete
      io.to(`build:${buildId}`).emit('build:complete', {
        buildId,
        status: freshBuild.status,
        artifacts: freshBuild.artifacts,
        duration: freshBuild.duration
      });
      
      // Send slack notifications
      try {
        await notifySlack({
          buildId,
          projectName: freshBuild.projectName,
          branch: freshBuild.branch,
          platform: 'ios',
          s3Link: testFlightLink
        });
      } catch (slackErr) {
        console.error('Slack notification failed:', slackErr.message);
      }
    } else {
      throw new Error(pollResult.error || 'Xcode Cloud build run failed.');
    }
  } catch (err) {
    const errorMsg = err.message || String(err);
    await logCallback('error', errorMsg);
    
    const freshBuild = await Build.findById(buildId);
    freshBuild.status = 'failed';
    freshBuild.error = errorMsg;
    freshBuild.finishedAt = new Date();
    freshBuild.duration = freshBuild.startedAt ? Math.floor((new Date() - freshBuild.startedAt) / 1000) : 0;
    await freshBuild.save();

    io.to(`build:${buildId}`).emit('build:status', { buildId, status: 'failed', error: errorMsg });
  }
}

/**
 * Dispatches Android builds to the self-hosted Mac Mini agent
 */
async function dispatchToAgent(build, io) {
  const buildId = String(build._id);
  const agentPlatform = build.platform === 'both' ? 'android' : build.platform;
  
  const logCallback = async (level, message) => {
    const freshBuild = await Build.findById(buildId);
    if (freshBuild) {
      freshBuild.logs.push({ timestamp: new Date(), level, message });
      await freshBuild.save();
    }
    io.to(`build:${buildId}`).emit('build:log', { buildId, level, message, timestamp: new Date() });
  };

  try {
    let keystorePayload = null;
    const ks = await Keystore.findOne({ userId: build.userId._id || build.userId, projectId: build.projectId });
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
      await logCallback('info', `Attached keystore details for project: ${build.projectName}`);
    } else {
      await logCallback('info', `No keystore found for project: ${build.projectName}. Build might be unsigned.`);
    }

    const agentPayload = {
      buildId,
      projectId: build.projectId,
      projectName: build.projectName,
      repoUrl: build.repoUrl,
      branch: build.branch,
      platform: agentPlatform,
      androidFormat: build.androidFormat || 'apk',
      versionCode: build.buildNumber,
      versionName: build.versionName || '1.0.0',
      buildType: build.buildType || 'testing',
      provider: build.provider,
      callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/agent/callback`,
      agentSecret: process.env.BUILD_AGENT_SECRET,
      keystore: keystorePayload,
    };

    await logCallback('info', 'Connecting to Mac Mini build agent...');
    await axios.post(
      `http://${process.env.BUILD_AGENT_HOST}:${process.env.BUILD_AGENT_PORT}/build`,
      agentPayload,
      { timeout: 5000 }
    );

    await logCallback('info', 'Android build successfully dispatched to Mac Mini build agent.');
  } catch (err) {
    const errorMsg = `Failed to reach Mac Mini build agent: ${err.message}`;
    await logCallback('error', errorMsg);
    
    if (build.platform === 'android') {
      const freshBuild = await Build.findById(buildId);
      freshBuild.status = 'failed';
      freshBuild.error = errorMsg;
      freshBuild.finishedAt = new Date();
      await freshBuild.save();
      io.to(`build:${buildId}`).emit('build:status', { buildId, status: 'failed', error: errorMsg });
    }
  }
}

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
    const build = await Build.findById(buildId).populate('userId');
    if (!build) return;

    build.status = 'building';
    build.startedAt = new Date();
    await build.save();
    io.to(`build:${buildId}`).emit('build:status', { buildId, status: 'building' });

    try {
      if (build.platform === 'android') {
        await dispatchToAgent(build, io);
      } else if (build.platform === 'ios') {
        await processXcodeCloudBuild(build, io);
      } else if (build.platform === 'both') {
        await Promise.all([
          dispatchToAgent(build, io),
          processXcodeCloudBuild(build, io)
        ]);
      }
    } catch (err) {
      console.error('Build process error:', err.message);
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
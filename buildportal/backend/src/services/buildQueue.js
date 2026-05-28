import Bull from 'bull';
import axios from 'axios';
import Build from '../models/Build.js';
// import Keystore from '../models/Keystore.js'; // ← Mac Mini: was used to attach keystore to agent payload. Android now uses GitHub Actions.
import AppleCredential from '../models/AppleCredential.js';
import { notifySlack } from './slackService.js';
import { getPresignedUrl, getObjectFromS3 } from './s3Service.js';
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

    // Step 1.5: Fetch user-uploaded Apple App Store Connect Credentials if they exist
    let appleCreds = null;
    try {
      const appleKey = await AppleCredential.findOne({ userId: build.userId._id || build.userId, projectId: build.projectId });
      if (appleKey) {
        await logCallback('info', 'Found project-specific Apple App Store Connect Credentials. Fetching key from S3...');
        const s3Stream = await getObjectFromS3(appleKey.p8KeyS3Key);
        
        // Convert S3 stream to string
        const privateKey = await new Promise((resolve, reject) => {
          const chunks = [];
          s3Stream.on('data', chunk => chunks.push(chunk));
          s3Stream.on('error', reject);
          s3Stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        });

        appleCreds = {
          apiKeyId: appleKey.apiKeyId,
          apiIssuer: appleKey.apiIssuer,
          privateKey
        };
        await logCallback('info', `Successfully fetched and verified Apple Key ID: ${appleKey.apiKeyId}`);
      } else {
        await logCallback('info', 'No project-specific Apple Credentials found. Falling back to default system key.');
      }
    } catch (credErr) {
      await logCallback('warn', `Failed to fetch dynamic Apple credentials: ${credErr.message}. Falling back to default system key.`);
    }

    // Step 2: Trigger build on Xcode Cloud
    const triggerResult = await triggerXcodeCloudBuild({
      repoUrl: build.repoUrl,
      branch: build.branch,
      config: parsedConfig,
      appleCreds
    }, logCallback);

    // Step 3: Start polling
    await logCallback('info', 'Started polling Xcode Cloud build run status...');
    const pollResult = await pollXcodeCloudBuild(triggerResult.buildRunId, logCallback, appleCreds);

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
 * Dispatches ALL Android builds to GitHub Actions via workflow_dispatch API.
 * Handles testing, UAT, and production build types.
 */
async function dispatchToGitHubActions(build, io) {
  const buildId = String(build._id);

  const logCallback = async (level, message) => {
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
      throw new Error('User GitHub access token is missing. Please re-authenticate.');
    }

    // Parse owner/repo from the repo URL
    const { path: repoPath } = parseRepoUrl(build.repoUrl);
    const [owner, repo] = repoPath.split('/');
    if (!owner || !repo) {
      throw new Error(`Could not parse owner/repo from repoUrl: ${build.repoUrl}`);
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const callbackSecret = process.env.GITHUB_ACTIONS_CALLBACK_SECRET;
    const workflowFile = 'buildportal-android.yml';

    await logCallback('info', `🔍 Verifying GitHub Actions workflow file exists: .github/workflows/${workflowFile}`);

    // Check the workflow file exists on the target branch before dispatching
    try {
      await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows/${workflowFile}?ref=${encodeURIComponent(build.branch)}`,
        {
          headers: {
            Authorization: `token ${user.accessToken}`,
            Accept: 'application/vnd.github.v3.raw',
            'User-Agent': 'BuildPortal',
          },
        }
      );
      await logCallback('info', `✅ Workflow file found. Dispatching build to GitHub Actions...`);
    } catch (checkErr) {
      if (checkErr.response?.status === 404) {
        throw new Error(
          `GitHub Actions workflow file not found: .github/workflows/${workflowFile} on branch "${build.branch}". ` +
          `Please commit this file to your repository. See the BuildPortal docs for the required template.`
        );
      }
      throw new Error(`Failed to verify workflow file: ${checkErr.message}`);
    }

    // Trigger the workflow via workflow_dispatch
    try {
      await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`,
        {
          ref: build.branch,
          inputs: {
            build_id: buildId,
            version_code: String(build.buildNumber || 1),
            version_name: build.versionName || '1.0.0',
            build_type: build.buildType || 'testing',
            android_format: build.androidFormat || 'apk',
            callback_url: `${backendUrl}/api/agent/github-actions/callback`,
            callback_secret: callbackSecret,
          },
        },
        {
          headers: {
            Authorization: `token ${user.accessToken}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'BuildPortal',
          },
        }
      );
    } catch (dispatchErr) {
      if (dispatchErr.response?.status === 404) {
        throw new Error(
          `GitHub Actions workflow file was found on branch "${build.branch}", but triggering dispatch failed with a 404. ` +
          `This is a known GitHub limitation: for the workflow_dispatch API to work, the workflow file ` +
          `(.github/workflows/${workflowFile}) must exist on your repository's default branch (usually "main" or "master"). ` +
          `Please commit and push the workflow file to your default branch first, then you can run builds on any branch.`
        );
      }
      throw dispatchErr;
    }

    await logCallback('info', `🚀 GitHub Actions workflow dispatched successfully for ${owner}/${repo} @ ${build.branch}.`);
    await logCallback('info', `⏳ Waiting for GitHub Actions to run the build and report back...`);
    await logCallback('info', `🔗 Monitor progress at: https://github.com/${owner}/${repo}/actions`);
  } catch (err) {
    const errorMsg = `GitHub Actions dispatch failed: ${err.message}`;
    await logCallback('error', errorMsg);

    const freshBuild = await Build.findById(buildId);
    if (freshBuild) {
      freshBuild.status = 'failed';
      freshBuild.error = errorMsg;
      freshBuild.finishedAt = new Date();
      await freshBuild.save();
    }
    io.to(`build:${buildId}`).emit('build:status', { buildId, status: 'failed', error: errorMsg });
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

  buildQueue = new Bull('build-queue-gha', redisUrl, queueOptions);

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
        // ✅ All Android builds → GitHub Actions (testing / UAT / production)
        await dispatchToGitHubActions(build, io);
      } else if (build.platform === 'ios') {
        await processXcodeCloudBuild(build, io);
      } else if (build.platform === 'both') {
        // All Android → GitHub Actions; iOS → Xcode Cloud
        await Promise.all([
          dispatchToGitHubActions(build, io),
          processXcodeCloudBuild(build, io),
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
import express from 'express';
import { execSync } from 'child_process';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, statSync, createReadStream } from 'fs';
import { join } from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5001;
const AGENT_SECRET = process.env.AGENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL;
const WORKSPACE = process.env.WORKSPACE || '/tmp/buildportal_workspace';

if (!AGENT_SECRET || !BACKEND_URL) {
  console.error('Missing required env vars: AGENT_SECRET and BACKEND_URL are mandatory.');
  process.exit(1);
}

async function sendLog(buildId, level, message) {
  try {
    await axios.post(`${BACKEND_URL}/api/agent/log`, {
      secret: AGENT_SECRET,
      buildId,
      level,
      message,
    }, { timeout: 5000 });
  } catch (e) {
    console.error('sendLog failed:', e.message);
  }
}

async function sendCallback(buildId, payload) {
  try {
    await axios.post(`${BACKEND_URL}/api/agent/callback`, {
      secret: AGENT_SECRET,
      buildId,
      ...payload,
    }, { timeout: 15000 });
  } catch (e) {
    console.error('sendCallback failed:', e.message);
  }
}

function runCommand(cmd, cwd) {
  return execSync(cmd, { cwd, stdio: 'inherit' });
}

function fileSize(path) {
  try { return statSync(path).size; } catch { return 0; }
}

async function uploadFileToBackend(localPath, buildId, platform) {
  const form = new FormData();
  form.append('secret', AGENT_SECRET);
  form.append('buildId', buildId);
  form.append('platform', platform);
  form.append('file', createReadStream(localPath));

  const response = await axios.post(`${BACKEND_URL}/api/agent/upload`, form, {
    headers: {
      ...form.getHeaders(),
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return response.data;
}

mkdirSync(WORKSPACE, { recursive: true });

app.post('/build', async (req, res) => {
  const { buildId, repoUrl, branch, platform, agentSecret, projectName, keystore, androidFormat } = req.body;
  if (agentSecret !== AGENT_SECRET) return res.status(403).json({ error: 'Forbidden' });
  if (!buildId || !repoUrl || !branch || !platform) return res.status(400).json({ error: 'Missing params' });

  res.json({ accepted: true, buildId });

  const workDir = join(WORKSPACE, buildId);
  mkdirSync(workDir, { recursive: true });

  try {
    await sendLog(buildId, 'info', `Cloning ${repoUrl} @ ${branch}`);
    runCommand(`git clone --depth 1 --branch ${branch} ${repoUrl} .`, workDir);

    let commitSha = '';
    let commitMessage = '';
    try { commitSha = execSync('git rev-parse --short HEAD', { cwd: workDir }).toString().trim(); } catch {}
    try { commitMessage = execSync('git log -1 --pretty=%B', { cwd: workDir }).toString().trim(); } catch {}

    // Install JavaScript dependencies for React Native / Hybrid projects
    if (existsSync(join(workDir, 'package.json'))) {
      await sendLog(buildId, 'info', 'Found package.json. Installing JavaScript dependencies...');
      try {
        if (existsSync(join(workDir, 'yarn.lock'))) {
          await sendLog(buildId, 'info', 'Running yarn install...');
          runCommand('yarn install', workDir);
        } else if (existsSync(join(workDir, 'pnpm-lock.yaml'))) {
          await sendLog(buildId, 'info', 'Running pnpm install...');
          runCommand('pnpm install', workDir);
        } else if (existsSync(join(workDir, 'package-lock.json'))) {
          await sendLog(buildId, 'info', 'Running npm ci...');
          runCommand('npm ci', workDir);
        } else {
          await sendLog(buildId, 'info', 'Running npm install...');
          runCommand('npm install', workDir);
        }
        await sendLog(buildId, 'info', 'JavaScript dependencies successfully installed.');
      } catch (err) {
        await sendLog(buildId, 'error', `Failed to install JavaScript dependencies: ${err.message}`);
        throw err;
      }
    }

    const artifacts = {};
    const distributionLinks = {};
    const logs = [];

    if (platform === 'android' || platform === 'both') {
      await sendLog(buildId, 'info', 'Android build starting');

      // Auto-detect Android project root (pure Android vs React Native/Flutter subfolder)
      let gradleDir = workDir;
      if (!existsSync(join(gradleDir, 'gradlew')) && existsSync(join(gradleDir, 'android', 'gradlew'))) {
        gradleDir = join(workDir, 'android');
        await sendLog(buildId, 'info', 'Detected Android project in "android" subdirectory.');
      }

      let signingParams = '';
      if (keystore && keystore.hasKeystore) {
        await sendLog(buildId, 'info', `Downloading project keystore securely: ${keystore.filename}`);
        const keystoreLocalPath = join(gradleDir, keystore.filename || 'release.keystore');
        
        const ksResponse = await axios.get(`${BACKEND_URL}/api/agent/keystore/${buildId}?secret=${AGENT_SECRET}`, {
          responseType: 'arraybuffer',
        });
        
        writeFileSync(keystoreLocalPath, Buffer.from(ksResponse.data));
        signingParams = ` -Pandroid.injected.signing.store.file="${keystoreLocalPath}" -Pandroid.injected.signing.store.password="${keystore.password}" -Pandroid.injected.signing.key.alias="${keystore.alias}" -Pandroid.injected.signing.key.password="${keystore.keyPassword}"`;
        await sendLog(buildId, 'info', 'Keystore successfully downloaded and signing parameters configured.');
      } else {
        await sendLog(buildId, 'info', 'No keystore provided. Initiating unsigned Android release build.');
      }

      if (existsSync(join(gradleDir, 'fastlane', 'Fastfile'))) {
        await sendLog(buildId, 'info', 'Running fastlane android beta');
        runCommand('bundle exec fastlane android beta', gradleDir);
      } else {
        // Ensure gradlew is executable on UNIX systems
        try {
          runCommand('chmod +x gradlew', gradleDir);
        } catch {}
        if (androidFormat === 'aab') {
          await sendLog(buildId, 'info', 'Running gradle bundleRelease');
          runCommand(`./gradlew bundleRelease --no-daemon${signingParams}`, gradleDir);
        } else {
          await sendLog(buildId, 'info', 'Running gradle assembleRelease');
          runCommand(`./gradlew assembleRelease --no-daemon${signingParams}`, gradleDir);
        }
      }

      const buildFormatFile = androidFormat === 'aab' ? 'app-release.aab' : 'app-release.apk';
      const buildOutputPath = androidFormat === 'aab'
        ? join(gradleDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')
        : join(gradleDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

      if (!existsSync(buildOutputPath)) throw new Error(`Android ${androidFormat === 'aab' ? 'AAB' : 'APK'} not found`);

      await sendLog(buildId, 'info', `Uploading ${androidFormat === 'aab' ? 'AAB' : 'APK'} to backend...`);
      const uploadResult = await uploadFileToBackend(buildOutputPath, buildId, 'android');

      artifacts.android = {
        fileName: buildFormatFile,
        s3Key: uploadResult.s3Key,
        size: fileSize(buildOutputPath),
      };

      const linkFile = join(gradleDir, 'fastlane', 'android_distribution_link.txt');
      if (existsSync(linkFile)) {
        distributionLinks.android = readFileSync(linkFile, 'utf8').trim();
      }
    }

    if (platform === 'ios' || platform === 'both') {
      await sendLog(buildId, 'info', 'iOS build starting');

      if (existsSync(join(workDir, 'fastlane', 'Fastfile'))) {
        await sendLog(buildId, 'info', 'Running fastlane ios beta');
        runCommand('bundle exec fastlane ios beta', workDir);
      } else {
        await sendLog(buildId, 'info', 'Running xcodebuild fallback');
        runCommand('cd ios && xcodebuild -workspace *.xcworkspace -scheme Release -archivePath build.xcarchive archive', workDir);
        runCommand('cd ios && xcodebuild -exportArchive -archivePath build.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath output', workDir);
      }

      const ipaPath = join(workDir, 'build', 'ios', 'ipa', `${projectName}.ipa`);
      if (!existsSync(ipaPath)) throw new Error('iOS IPA not found');

      await sendLog(buildId, 'info', 'Uploading IPA to backend...');
      const uploadResult = await uploadFileToBackend(ipaPath, buildId, 'ios');

      artifacts.ios = {
        fileName: `${projectName || 'app'}.ipa`,
        s3Key: uploadResult.s3Key,
        size: fileSize(ipaPath),
      };

      const linkFile = join(workDir, 'fastlane', 'ios_distribution_link.txt');
      if (existsSync(linkFile)) {
        distributionLinks.ios = readFileSync(linkFile, 'utf8').trim();
      }
    }

    logs.push({ level: 'info', message: 'Build finished successfully' });

    await sendCallback(buildId, {
      status: 'success',
      artifacts,
      distributionLinks,
      logs,
      commitSha,
      commitMessage,
    });
  } catch (err) {
    const message = err?.message || String(err);
    await sendLog(buildId, 'error', message);
    await sendCallback(buildId, {
      status: 'failed',
      error: message,
      logs: [{ level: 'error', message }],
    });
  } finally {
    try { rmSync(workDir, { recursive: true, force: true }); } catch {}
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'mac-mini' }));

app.listen(PORT, () => console.log(`Mac Mini agent running on port ${PORT}`));

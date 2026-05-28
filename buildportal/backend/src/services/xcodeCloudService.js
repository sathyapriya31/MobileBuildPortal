import jwt from 'jsonwebtoken';
import fs from 'fs';
import { join } from 'path';
import axios from 'axios';

const ASC_BASE_URL = 'https://api.appstoreconnect.apple.com/v1';

/**
 * Generates an Apple App Store Connect JWT token signed with ES256.
 * Valid for 20 minutes as specified by Apple.
 */
export function generateAppStoreConnectToken(appleCreds) {
  const apiKeyId = appleCreds?.apiKeyId || process.env.APPLE_API_KEY_ID;
  const issuerId = appleCreds?.apiIssuer || process.env.APPLE_API_ISSUER;

  if (!apiKeyId || !issuerId) {
    throw new Error('Missing Apple App Store Connect Credentials in environment or request (Key ID / Issuer ID)');
  }

  let privateKey;
  if (appleCreds?.privateKey) {
    privateKey = appleCreds.privateKey;
  } else {
    let keyPath = process.env.APPLE_API_KEY_PATH || 'key/AuthKey_2GZN4HH9K8.p8';
    if (keyPath.startsWith('/')) {
      if (!fs.existsSync(keyPath)) {
        keyPath = join(process.cwd(), keyPath);
        if (!fs.existsSync(keyPath)) {
          keyPath = join(process.cwd(), keyPath.substring(1));
        }
      }
    } else {
      keyPath = join(process.cwd(), keyPath);
    }

    if (!fs.existsSync(keyPath)) {
      throw new Error(`Apple Auth Key .p8 file not found at: ${keyPath}`);
    }
    privateKey = fs.readFileSync(keyPath, 'utf8');
  }

  const now = Math.round((new Date()).getTime() / 1000);
  
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 1199, // Expiration at 19 minutes 59 seconds
    aud: 'appstoreconnect-v1'
  };

  const signOptions = {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: apiKeyId,
      typ: 'JWT'
    }
  };

  return jwt.sign(payload, privateKey, signOptions);
}

/**
 * Helper to match repository URLs ignoring protocol, ssh syntax, and trailing .git
 */
function matchRepoUrls(url1, url2) {
  if (!url1 || !url2) return false;
  const clean = (url) => url.trim().toLowerCase().replace(/\.git$/, '').replace(/^https?:\/\//, '').replace(/^git@/, '').replace(':', '/');
  return clean(url1) === clean(url2);
}

/**
 * Helper to get clean path / name from git repository URL
 */
export function parseRepoUrl(url) {
  let cleanUrl = url.trim().replace(/\.git$/, '');
  let host = '';
  let path = '';
  
  if (cleanUrl.startsWith('git@')) {
    const parts = cleanUrl.substring(4).split(':');
    host = parts[0];
    path = parts[1];
  } else if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    const urlObj = new URL(cleanUrl);
    host = urlObj.hostname;
    path = urlObj.pathname.substring(1);
  }
  
  return { host, path };
}

/**
 * Triggers an Xcode Cloud build run using App Store Connect API
 * 
 * @param {object} params - Build parameters
 * @param {string} params.repoUrl - Remote git repo URL
 * @param {string} params.branch - Name of the branch to build
 * @param {object} params.config - Parsed YAML configuration
 * @param {function} logCallback - Function to stream logs to DB and sockets
 * @returns {object} The triggered build run details and App ID
 */
export async function triggerXcodeCloudBuild({ repoUrl, branch, config, appleCreds }, logCallback) {
  await logCallback('info', 'Generating App Store Connect API JWT token...');
  const token = generateAppStoreConnectToken(appleCreds);
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1. Fetch SCM Repositories and find matching repo
  await logCallback('info', 'Connecting to App Store Connect. Fetching SCM Repositories...');
  const reposRes = await axios.get(`${ASC_BASE_URL}/scmRepositories`, { headers });
  const repos = reposRes.data?.data || [];
  
  const matchedRepo = repos.find(r => 
    matchRepoUrls(r.attributes?.httpCloneUrl, repoUrl) ||
    matchRepoUrls(r.attributes?.sshCloneUrl, repoUrl)
  );
  if (!matchedRepo) {
    throw new Error(`No matching SCM repository found in App Store Connect for: ${repoUrl}. Please ensure your repository is connected to Xcode Cloud.`);
  }
  
  const repoId = matchedRepo.id;
  await logCallback('info', `Found SCM Repository ID: ${repoId} matching ${repoUrl}`);

  // 2. Fetch Git References for repository to find branch ID
  await logCallback('info', `Resolving SCM Git Reference for branch: "${branch}"...`);
  const refsRes = await axios.get(`${ASC_BASE_URL}/scmRepositories/${repoId}/gitReferences`, { headers });
  const refs = refsRes.data?.data || [];
  
  // Find branch matching branch name
  const matchedRef = refs.find(r => 
    r.attributes?.name === branch || 
    r.attributes?.canonicalName === `refs/heads/${branch}` ||
    r.attributes?.canonicalName?.endsWith(`/${branch}`)
  );
  
  if (!matchedRef) {
    throw new Error(`SCM Git Reference for branch "${branch}" was not found in App Store Connect. Please ensure the branch is pushed to origin.`);
  }

  const gitReferenceId = matchedRef.id;
  await logCallback('info', `Resolved SCM Git Reference ID: ${gitReferenceId}`);

  // 3. Find Xcode Cloud Product associated with this Repository
  await logCallback('info', 'Locating associated Xcode Cloud Product...');
  const productsRes = await axios.get(`${ASC_BASE_URL}/ciProducts?include=app,primaryRepositories`, { headers });
  const products = productsRes.data?.data || [];
  
  const matchedProduct = products.find(p => {
    const repos = p.relationships?.primaryRepositories?.data || [];
    return repos.some(r => r.id === repoId);
  });
  if (!matchedProduct) {
    throw new Error('No Xcode Cloud Product found associated with this SCM Repository. Please set up an Xcode Cloud workflow in Xcode or App Store Connect.');
  }

  const productId = matchedProduct.id;
  const appId = matchedProduct.relationships?.app?.data?.id;
  await logCallback('info', `Found Product ID: ${productId} and App Store App ID: ${appId}`);

  // 4. Find Workflows for Product and select the target workflow
  await logCallback('info', 'Fetching Xcode Cloud Workflows...');
  const workflowsRes = await axios.get(`${ASC_BASE_URL}/ciProducts/${productId}/workflows`, { headers });
  const workflows = workflowsRes.data?.data || [];

  if (workflows.length === 0) {
    throw new Error('No Xcode Cloud workflows are defined for this product. Please define a workflow in Xcode or App Store Connect.');
  }

  let matchedWorkflow = null;
  const yamlConfig = config?.xcode_cloud || {};

  if (yamlConfig.workflow_id) {
    matchedWorkflow = workflows.find(w => w.id === yamlConfig.workflow_id);
    if (!matchedWorkflow) {
      await logCallback('warn', `Workflow ID "${yamlConfig.workflow_id}" specified in YAML was not found. Falling back...`);
    }
  }

  if (!matchedWorkflow && yamlConfig.workflow_name) {
    matchedWorkflow = workflows.find(w => w.attributes?.name?.toLowerCase() === yamlConfig.workflow_name.toLowerCase());
    if (!matchedWorkflow) {
      await logCallback('warn', `Workflow Name "${yamlConfig.workflow_name}" specified in YAML was not found. Falling back...`);
    }
  }

  // Fallback to first workflow
  if (!matchedWorkflow) {
    matchedWorkflow = workflows[0];
    await logCallback('info', `Selecting primary default workflow: "${matchedWorkflow.attributes?.name}"`);
  } else {
    await logCallback('info', `Selected workflow: "${matchedWorkflow.attributes?.name}"`);
  }

  const workflowId = matchedWorkflow.id;

  // 5. Trigger ciBuildRun
  await logCallback('info', `⚡ Initiating Xcode Cloud Build Run for workflow: "${matchedWorkflow.attributes?.name}"...`);
  const triggerPayload = {
    data: {
      type: 'ciBuildRuns',
      relationships: {
        workflow: {
          data: {
            type: 'ciWorkflows',
            id: workflowId
          }
        },
        sourceBranchOrTag: {
          data: {
            type: 'scmGitReferences',
            id: gitReferenceId
          }
        }
      }
    }
  };

  let buildRun;
  try {
    const triggerRes = await axios.post(`${ASC_BASE_URL}/ciBuildRuns`, triggerPayload, { headers });
    buildRun = triggerRes.data?.data;
  } catch (err) {
    if (err.response?.data?.errors?.length) {
      const appleErr = err.response.data.errors[0];
      throw new Error(`Apple Xcode Cloud Error (409): ${appleErr.detail || appleErr.title || 'Unknown conflict'} [Code: ${appleErr.code || 'None'}]`);
    }
    throw err;
  }

  if (!buildRun) {
    throw new Error('Failed to trigger Xcode Cloud build run: App Store Connect returned an empty response.');
  }

  await logCallback('info', `🎉 Xcode Cloud Build Run successfully triggered! Build Run ID: ${buildRun.id}`);
  return {
    buildRunId: buildRun.id,
    appId,
    workflowName: matchedWorkflow.attributes?.name
  };
}

/**
 * Polls the Xcode Cloud build run status until completed.
 * Calls logCallback with status transitions.
 * 
 * @param {string} buildRunId - Xcode Cloud build run ID
 * @param {function} logCallback - Function to write logs and socket events
 * @returns {object} The final build run status
 */
export async function pollXcodeCloudBuild(buildRunId, logCallback, appleCreds) {
  let completed = false;
  let attempts = 0;
  const maxAttempts = 120; // 30 minutes maximum polling time (15s intervals)
  let lastStatus = '';

  while (!completed && attempts < maxAttempts) {
    attempts++;
    // Wait 15 seconds
    await new Promise(resolve => setTimeout(resolve, 15000));

    try {
      const token = generateAppStoreConnectToken(appleCreds);
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await axios.get(`${ASC_BASE_URL}/ciBuildRuns/${buildRunId}`, { headers });
      const buildRun = res.data?.data;
      if (!buildRun) continue;

      const progress = buildRun.attributes?.executionProgress; // PENDING, RUNNING, COMPLETE
      const completionStatus = buildRun.attributes?.completionStatus; // SUCCEEDED, FAILED, ERRORED, CANCELED
      const buildNumber = buildRun.attributes?.number;

      const statusStr = `Xcode Cloud Progress: [${progress || 'UNKNOWN'}]` + 
        (completionStatus ? ` | Completion: [${completionStatus}]` : '') + 
        (buildNumber ? ` | Xcode Cloud Build #${buildNumber}` : '');

      if (statusStr !== lastStatus) {
        await logCallback('info', statusStr);
        lastStatus = statusStr;
      }

      if (progress === 'COMPLETE') {
        completed = true;
        return {
          status: completionStatus === 'SUCCEEDED' ? 'success' : 'failed',
          completionStatus,
          buildNumber,
          error: completionStatus !== 'SUCCEEDED' ? `Xcode Cloud build completed with status: ${completionStatus}` : null
        };
      }
    } catch (err) {
      await logCallback('error', `Error polling Xcode Cloud status: ${err.message}`);
    }
  }

  if (!completed) {
    throw new Error('Xcode Cloud build polling timed out after 30 minutes.');
  }
}

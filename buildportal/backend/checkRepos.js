import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { join } from 'path';
import axios from 'axios';
import { generateAppStoreConnectToken } from './src/services/xcodeCloudService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  console.log('Generating JWT...');
  const token = generateAppStoreConnectToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('Fetching scmRepositories from Apple...');
  const reposRes = await axios.get('https://api.appstoreconnect.apple.com/v1/scmRepositories', { headers });
  const repos = reposRes.data?.data || [];

  console.log('--- Connected SCM Repositories in App Store Connect ---');
  repos.forEach((repo, i) => {
    console.log(`[Repository #${i + 1}]`);
    console.log(`  ID: ${repo.id}`);
    console.log(`  Name: ${repo.attributes?.repositoryName}`);
    console.log(`  HTTP URL: ${repo.attributes?.httpCloneUrl}`);
    console.log(`  SSH URL: ${repo.attributes?.sshCloneUrl}`);
    console.log(`  Provider: ${repo.attributes?.scmProvider?.data?.id}`);
    console.log('----------------------------------------------------');
  });

  if (repos.length === 0) {
    console.log('No repositories found connected to this App Store Connect account.');
  }
}

run().catch(console.error);

import dotenv from 'dotenv';
import axios from 'axios';
import { generateAppStoreConnectToken } from './src/services/xcodeCloudService.js';

dotenv.config();

async function run() {
  console.log('Generating JWT...');
  const token = generateAppStoreConnectToken();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('Fetching ciProducts from Apple...');
  const res = await axios.get('https://api.appstoreconnect.apple.com/v1/ciProducts', { headers });
  const products = res.data?.data || [];

  console.log('--- Xcode Cloud Products ---');
  products.forEach((product, i) => {
    console.log(`[Product #${i + 1}]`);
    console.log(`  ID: ${product.id}`);
    console.log(`  Name: ${product.attributes?.name}`);
    console.log(`  Project Type: ${product.attributes?.productType}`);
    console.log(`  Relationships:`, JSON.stringify(product.relationships, null, 2));
    console.log('----------------------------------------------------');
  });

  if (products.length === 0) {
    console.log('No Xcode Cloud Products found.');
  }
}

run().catch(console.error);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Build = mongoose.model('Build', new mongoose.Schema({}, { strict: false }));
  const build = await Build.findOne().sort({ createdAt: -1 });

  if (!build) {
    console.log('Build 1001 not found');
  } else {
    console.log('Build State:', JSON.stringify(build.toObject(), null, 2));
  }

  await mongoose.disconnect();
}

run().catch(console.error);

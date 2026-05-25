import 'dotenv/config';
import mongoose from 'mongoose';
import Build from './src/models/Build.js';
import Keystore from './src/models/Keystore.js';
import User from './src/models/User.js';

async function clearDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buildportal';
  console.log(`Connecting to database: ${uri}`);
  
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB.');

    console.log('Clearing Build collection...');
    const buildRes = await Build.deleteMany({});
    console.log(`Deleted ${buildRes.deletedCount} builds.`);

    console.log('Clearing Keystore collection...');
    const keystoreRes = await Keystore.deleteMany({});
    console.log(`Deleted ${keystoreRes.deletedCount} keystores.`);

    console.log('Clearing User collection...');
    const userRes = await User.deleteMany({});
    console.log(`Deleted ${userRes.deletedCount} users.`);

    console.log('✅ Database cleared successfully.');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

clearDatabase();

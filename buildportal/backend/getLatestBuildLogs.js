import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const Build = mongoose.model('Build', new mongoose.Schema({}, { strict: false }));
  const build = await Build.findOne({}).sort({ createdAt: -1 });

  if (!build) {
    console.log('No builds found');
  } else {
    console.log('Latest Build Details:');
    console.log('ID:', build._id);
    console.log('Project:', build.projectName);
    console.log('Branch:', build.branch);
    console.log('Status:', build.status);
    console.log('Error:', build.error);
    console.log('\n--- Logs ---');
    if (build.logs && build.logs.length > 0) {
      build.logs.forEach(log => {
        console.log(`[${log.timestamp || ''}] [${log.level}] ${log.message}`);
      });
    } else {
      console.log('No logs found');
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);

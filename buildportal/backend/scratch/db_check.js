import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const BuildSchema = new mongoose.Schema({
  buildNumber: Number,
  projectId: String,
  userId: mongoose.Schema.Types.ObjectId,
  status: String,
  error: String,
  logs: [{ timestamp: Date, level: String, message: String }]
});

const Build = mongoose.model('Build', BuildSchema);

async function check() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const b = await Build.findOne({ buildNumber: 1006 }).sort({ createdAt: -1 });
  if (b) {
    console.log(`\n==================================================`);
    console.log(`Build #${b.buildNumber} - ID: ${b._id} - Status: ${b.status}`);
    console.log(`Error: ${b.error}`);
    console.log(`All Logs:`);
    for (const l of b.logs) {
      console.log(`[${l.level?.toUpperCase()}] ${l.message}`);
    }
  } else {
    console.log('Build not found');
  }

  await mongoose.disconnect();
}

check().catch(console.error);

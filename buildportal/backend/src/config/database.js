import mongoose from 'mongoose';

export async function connectDB() {
  const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/buildportal');
  console.log(`✅ MongoDB: ${conn.connection.host}`);
}
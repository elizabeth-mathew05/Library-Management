import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MongoDB connection string is not configured. Set MONGODB_URI or MONGO_URI.');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
};

export default connectDatabase;

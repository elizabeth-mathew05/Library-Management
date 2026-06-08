import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDatabase = async () => {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL;

  if (!mongoUri) {
    throw new Error('MongoDB connection string is not configured. Set MONGODB_URI, MONGO_URI, or DATABASE_URL in your deployment environment.');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
};

export default connectDatabase;

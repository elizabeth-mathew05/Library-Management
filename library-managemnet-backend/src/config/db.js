import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDatabase = async () => {
  const envCandidates = [
    ['MONGODB_URI', process.env.MONGODB_URI],
    ['MONGO_URI', process.env.MONGO_URI],
    ['DATABASE_URL', process.env.DATABASE_URL]
  ];

  const matched = envCandidates.find(([, value]) => Boolean(value));
  const mongoUri = matched?.[1];
  const sourceKey = matched?.[0];

  if (!mongoUri) {
    throw new Error('MongoDB connection string is not configured. Set MONGODB_URI, MONGO_URI, or DATABASE_URL in your deployment environment.');
  }

  const isLocalMongo = /mongodb:\/\/(127\.0\.0\.1|localhost)/i.test(mongoUri);
  const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

  if (isProduction && isLocalMongo) {
    throw new Error(
      `Invalid MongoDB URI from ${sourceKey}: localhost/127.0.0.1 cannot be used in production. Set a hosted MongoDB URI in Render environment variables.`
    );
  }

  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected using ${sourceKey}`);
};

export default connectDatabase;

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const defaultDatabaseName = process.env.MONGO_DB_NAME || 'library_management';
const connectRetries = Number(process.env.MONGO_CONNECT_RETRIES || 5);
const connectRetryDelayMs = Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS || 5000);

const normalizeMongoUri = (rawUri) => {
  try {
    const url = new URL(rawUri);

    // If no DB name is provided in URI path, use default database.
    if (!url.pathname || url.pathname === '/') {
      url.pathname = `/${defaultDatabaseName}`;
    }

    // For Atlas SRV strings, include sensible defaults when absent.
    if (url.protocol === 'mongodb+srv:') {
      if (!url.searchParams.has('retryWrites')) {
        url.searchParams.set('retryWrites', 'true');
      }
      if (!url.searchParams.has('w')) {
        url.searchParams.set('w', 'majority');
      }
    }

    return url.toString();
  } catch {
    return rawUri;
  }
};

const getSafeMongoTarget = (mongoUri) => {
  try {
    const url = new URL(mongoUri);
    return `${url.protocol}//${url.hostname}${url.pathname || ''}`;
  } catch {
    return 'unknown-target';
  }
};

const connectDatabase = async () => {
  const isProduction = String(process.env.NODE_ENV || '').toLowerCase() === 'production';

  const envCandidates = [
    ['MONGODB_URI', process.env.MONGODB_URI],
    // Keep MONGO_URI for local backward compatibility only.
    ...(!isProduction ? [['MONGO_URI', process.env.MONGO_URI]] : []),
    ['DATABASE_URL', process.env.DATABASE_URL]
  ];

  const matched = envCandidates.find(([, value]) => Boolean(value));
  const mongoUri = matched?.[1];
  const sourceKey = matched?.[0];

  if (!mongoUri) {
    throw new Error('MongoDB connection string is not configured. Set MONGODB_URI, MONGO_URI, or DATABASE_URL in your deployment environment.');
  }

  const isLocalMongo = /mongodb:\/\/(127\.0\.0\.1|localhost)/i.test(mongoUri);
  const hasPlaceholder = /<user>|<password>|<cluster>/i.test(mongoUri);

  if (hasPlaceholder) {
    throw new Error(
      `Invalid MongoDB URI from ${sourceKey}: placeholder values detected (<user>, <password>, <cluster>). Replace with real MongoDB Atlas values.`
    );
  }

  if (isProduction && isLocalMongo) {
    throw new Error(
      `Invalid MongoDB URI from ${sourceKey}: localhost/127.0.0.1 cannot be used in production. Set a hosted MongoDB URI in Render environment variables.`
    );
  }

  const normalizedMongoUri = normalizeMongoUri(mongoUri);
  const safeTarget = getSafeMongoTarget(normalizedMongoUri);

  for (let attempt = 1; attempt <= connectRetries; attempt += 1) {
    try {
      await mongoose.connect(normalizedMongoUri);
      console.log(`MongoDB connected using ${sourceKey} -> ${safeTarget}`);
      return;
    } catch (error) {
      const reason = error?.code || error?.name || 'UnknownError';
      const isLastAttempt = attempt === connectRetries;

      if (isLastAttempt) {
        throw new Error(
          `MongoDB connection failed using ${sourceKey} -> ${safeTarget}. Reason: ${reason}. ` +
            'Check Render env var value, Atlas Network Access IP allowlist, and DB user credentials.'
        );
      }

      console.warn(
        `MongoDB connect attempt ${attempt}/${connectRetries} failed (${reason}). Retrying in ${connectRetryDelayMs}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, connectRetryDelayMs));
    }
  }
};

export default connectDatabase;

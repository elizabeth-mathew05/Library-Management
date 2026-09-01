import dotenv from 'dotenv';
import app from './app.js';
import connectDatabase from './config/db.js';
import { startOverdueReminderScheduler } from './services/overdueReminderScheduler.js';
import seedDemoData from './utils/seedDemoData.js';

dotenv.config();

const port = process.env.PORT || 5000;

const ensureRequiredEnv = () => {
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'library-management-jwt-secret';
    console.warn('JWT_SECRET was not set. Using a fallback secret so the server can start. Add JWT_SECRET in the Render Environment tab, then redeploy.');
  }
};

const startServer = async () => {
  ensureRequiredEnv();
  await connectDatabase();
  if (process.env.SEED_DEMO_DATA !== 'false') {
    await seedDemoData();
  }
  startOverdueReminderScheduler();
  app.listen(port, () => {
    console.log(`Library backend listening on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
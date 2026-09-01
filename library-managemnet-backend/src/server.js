import app from './app.js';
import connectDatabase from './config/db.js';
import { startOverdueReminderScheduler } from './services/overdueReminderScheduler.js';
import seedDemoData from './utils/seedDemoData.js';

const port = process.env.PORT || 5000;

const validateRequiredEnv = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing required environment variable: JWT_SECRET. Set it in deployment environment and redeploy.');
  }
};

const startServer = async () => {
  validateRequiredEnv();
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
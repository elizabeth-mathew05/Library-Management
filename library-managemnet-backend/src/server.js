import app from './app.js';
import connectDatabase from './config/db.js';
import { startOverdueReminderScheduler } from './services/overdueReminderScheduler.js';

const port = process.env.PORT || 5000;

const validateRequiredEnv = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing required environment variable: JWT_SECRET. Set it in deployment environment and redeploy.');
  }
};

const startServer = async () => {
  validateRequiredEnv();
  await connectDatabase();
  startOverdueReminderScheduler();
  app.listen(port, () => {
    console.log(`Library backend listening on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
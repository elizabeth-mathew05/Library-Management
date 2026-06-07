import app from './app.js';
import connectDatabase from './config/db.js';
import { startOverdueReminderScheduler } from './services/overdueReminderScheduler.js';

const port = process.env.PORT || 5000;

const startServer = async () => {
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

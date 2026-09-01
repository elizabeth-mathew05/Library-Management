import connectDatabase from '../config/db.js';
import seedDemoData from '../utils/seedDemoData.js';

const run = async () => {
  await connectDatabase();
  await seedDemoData();
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to seed demo data', error);
  process.exit(1);
});

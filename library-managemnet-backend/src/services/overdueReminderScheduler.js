import { processOverdueReminders } from '../controllers/borrowController.js';

const reminderHour = Number(process.env.OVERDUE_REMINDER_HOUR ?? 9);
const reminderMinute = Number(process.env.OVERDUE_REMINDER_MINUTE ?? 0);
const checkIntervalMs = Number(process.env.OVERDUE_REMINDER_CHECK_MS ?? 60_000);

let lastRunDateKey = null;

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shouldRunNow = (now) => {
  const matchesTime = now.getHours() === reminderHour && now.getMinutes() === reminderMinute;
  if (!matchesTime) {
    return false;
  }

  const dateKey = getDateKey(now);
  if (lastRunDateKey === dateKey) {
    return false;
  }

  lastRunDateKey = dateKey;
  return true;
};

const runOverdueReminderJob = async () => {
  const reminders = await processOverdueReminders({ force: false });
  if (reminders.length > 0) {
    console.log(`Automatic overdue reminders sent: ${reminders.length}`);
  }
};

const startOverdueReminderScheduler = () => {
  console.log(
    `Overdue reminder scheduler active at ${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')} (check ${checkIntervalMs}ms)`
  );

  return setInterval(async () => {
    try {
      const now = new Date();
      if (!shouldRunNow(now)) {
        return;
      }

      await runOverdueReminderJob();
    } catch (error) {
      console.error('Automatic overdue reminder job failed', error);
    }
  }, checkIntervalMs);
};

export { startOverdueReminderScheduler, runOverdueReminderJob };

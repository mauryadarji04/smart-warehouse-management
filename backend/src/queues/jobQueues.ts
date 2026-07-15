import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // required by BullMQ
});

export const reorderQueue = new Queue('reorder', { connection });
export const forecastQueue = new Queue('forecast', { connection });
export const expiryQueue = new Queue('expiry', { connection });

/** Schedule all recurring jobs — idempotent, safe to call on every startup */
export const scheduleRecurringJobs = async () => {
  await reorderQueue.upsertJobScheduler(
    'daily-reorder',
    { pattern: process.env.CRON_REORDER_CHECK || '0 6 * * *' },
    { name: 'reorder-check', data: {} }
  );

  await forecastQueue.upsertJobScheduler(
    'nightly-forecast',
    { pattern: process.env.CRON_FORECAST_RUN || '0 0 * * *' },
    { name: 'forecast-run', data: {} }
  );

  await expiryQueue.upsertJobScheduler(
    'daily-expiry',
    { pattern: process.env.CRON_EXPIRY_CHECK || '0 7 * * *' },
    { name: 'expiry-check', data: {} }
  );

  console.log('✅ BullMQ recurring jobs scheduled');
};

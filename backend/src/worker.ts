import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { checkAndCreatePurchaseOrders } from './services/reorderService';
import { runNightlyForecast, updateForecastAccuracy } from './services/forecastingService';
import { checkExpiringItems } from './services/expiryService';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const workerOpts = {
  connection,
  concurrency: 1,
  limiter: { max: 1, duration: 1000 },
};

const reorderWorker = new Worker(
  'reorder',
  async (job) => {
    console.log(`[Worker] Processing job: ${job.name}`);
    const result = await checkAndCreatePurchaseOrders();
    console.log(`[Worker] Reorder complete: ${result.ordersCreated} orders created`);
    return result;
  },
  { ...workerOpts, attempts: 3, backoff: { type: 'exponential', delay: 5000 } } as any
);

const forecastWorker = new Worker(
  'forecast',
  async (job) => {
    console.log(`[Worker] Processing job: ${job.name}`);
    await runNightlyForecast();
    await updateForecastAccuracy();
    console.log('[Worker] Forecast complete');
  },
  { ...workerOpts, attempts: 3, backoff: { type: 'exponential', delay: 5000 } } as any
);

const expiryWorker = new Worker(
  'expiry',
  async (job) => {
    console.log(`[Worker] Processing job: ${job.name}`);
    const result = await checkExpiringItems();
    console.log(`[Worker] Expiry check complete:`, result);
    return result;
  },
  { ...workerOpts, attempts: 3, backoff: { type: 'exponential', delay: 5000 } } as any
);

for (const worker of [reorderWorker, forecastWorker, expiryWorker]) {
  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.name} failed (attempt ${job?.attemptsMade}):`, err.message);
  });
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.name} completed`);
  });
}

console.log('🔧 BullMQ workers started — listening for jobs...');

// Graceful shutdown
const shutdown = async () => {
  await Promise.all([reorderWorker.close(), forecastWorker.close(), expiryWorker.close()]);
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

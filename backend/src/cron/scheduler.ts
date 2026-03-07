import cron from 'node-cron';
import { checkAndCreatePurchaseOrders } from '../services/reorderService';

// ── Cron Jobs — each phase adds its job here ──────────────────
// Times are set via .env so they're easily adjustable

export const initCronJobs = () => {
  console.log('⏰ Initialising cron jobs...');

  // Phase 3 — Auto Reorder Check (runs at 6 AM daily)
  cron.schedule(process.env.CRON_REORDER_CHECK || '0 6 * * *', async () => {
    console.log('[CRON] Running auto-reorder check...');
    try {
      const result = await checkAndCreatePurchaseOrders();
      console.log(`[CRON] Auto-reorder complete: ${result.ordersCreated} orders created`);
    } catch (error) {
      console.error('[CRON] Auto-reorder failed:', error);
    }
  });

  // Phase 4 — Demand Forecast (runs at midnight)
  cron.schedule(process.env.CRON_FORECAST_RUN || '0 0 * * *', async () => {
    console.log('[CRON] Running demand forecast...');
    // import & call: ForecastingService.runNightlyForecast()
  });

  // Phase 5 — Expiry Check (runs at 7 AM daily)
  cron.schedule(process.env.CRON_EXPIRY_CHECK || '0 7 * * *', async () => {
    console.log('[CRON] Running expiry check...');
    // import & call: ExpiryService.checkExpiringItems()
  });

  console.log('✅ Cron jobs scheduled');
};
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import alertRoutes from './routes/alertRoutes';
import supplierRoutes from './routes/supplierRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import reorderRoutes from './routes/reorderRoutes';
import { errorHandler } from './middleware/errorHandler';
import { initCronJobs } from './cron/scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(), 
    env: process.env.NODE_ENV,
    phase: 'Phase 3 — EOQ Auto-Reorder'
  });
});

// ── API Routes ────────────────────────────────────────────────
// Phase 1
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/alerts', alertRoutes);

// Phase 2
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);

// Phase 3
app.use('/api/reorder', reorderRoutes);

// Phase 4: Forecasting (coming next)
// app.use('/api/forecasts', forecastRoutes);

// Phase 6: Analytics
// app.use('/api/analytics', analyticsRoutes);

// Phase 7: Auth
// app.use('/api/auth', authRoutes);

// ── Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server & Cron ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Smart Warehouse API — ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`✅ Phase 3 active: /api/reorder`);
  
  // Initialize cron jobs
  initCronJobs();
});

export default app;
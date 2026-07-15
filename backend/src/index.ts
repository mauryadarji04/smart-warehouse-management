import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env variable is required');
if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET env variable is required');

import { logger } from './utils/logger';
import productRoutes from './routes/productRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import alertRoutes from './routes/alertRoutes';
import supplierRoutes from './routes/supplierRoutes';
import purchaseOrderRoutes from './routes/purchaseOrderRoutes';
import reorderRoutes from './routes/reorderRoutes';
import { errorHandler } from './middleware/errorHandler';
import { scheduleRecurringJobs } from './queues/jobQueues';
import forecastRoutes from './routes/forecastRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import authRoutes from './routes/authRoutes';
import { globalLimiter } from './middleware/rateLimiter';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(globalLimiter);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/reorder', reorderRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, '🚀 Smart Warehouse API started');
  scheduleRecurringJobs().catch((err) => logger.error(err, 'Failed to schedule jobs'));
});

export default app;

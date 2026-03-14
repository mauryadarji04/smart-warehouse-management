import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

router.get('/inventory-value', analyticsController.getInventoryValue);
router.get('/abc-analysis', analyticsController.getABCAnalysis);
router.get('/stock-turnover', analyticsController.getStockTurnover);
router.get('/forecast-accuracy', analyticsController.getForecastAccuracy);
router.get('/sales-trends', analyticsController.getSalesTrends);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/dashboard', analyticsController.getDashboard);

export default router;
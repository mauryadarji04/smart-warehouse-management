import { Router } from 'express';
import * as forecastController from '../controllers/forecastController';

const router = Router();

router.post('/run', forecastController.triggerForecast);
router.post('/record-sale', forecastController.recordSaleManually);
router.get('/accuracy', forecastController.getForecastAccuracy);
router.get('/:productId', forecastController.getProductForecasts);

export default router;
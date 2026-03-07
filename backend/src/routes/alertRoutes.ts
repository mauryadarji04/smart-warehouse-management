import { Router } from 'express';
import * as alertController from '../controllers/alertController';

const router = Router();

router.get('/', alertController.getAllAlerts);
router.get('/stats', alertController.getAlertStats);
router.patch('/:id/read', alertController.markAlertAsRead);
router.patch('/read-all', alertController.markAllAlertsAsRead);

export default router;

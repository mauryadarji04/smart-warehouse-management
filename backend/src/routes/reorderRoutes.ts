import { Router } from 'express';
import * as reorderController from '../controllers/reorderController';

const router = Router();

router.post('/check', reorderController.triggerReorderCheck);
router.get('/preview', reorderController.previewReorders);
router.post('/calculate-eoq', reorderController.calculateProductEOQ);

export default router;
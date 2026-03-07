import { Router } from 'express';
import * as poController from '../controllers/purchaseOrderController';

const router = Router();

router.get('/', poController.getAllPurchaseOrders);
router.get('/:id', poController.getPurchaseOrderById);
router.post('/', poController.createPurchaseOrder);
router.patch('/:id/status', poController.updatePurchaseOrderStatus);
router.post('/:id/receive', poController.receivePurchaseOrder);
router.delete('/:id', poController.deletePurchaseOrder);

export default router;

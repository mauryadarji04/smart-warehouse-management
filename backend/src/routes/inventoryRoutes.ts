import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';

const router = Router();

router.get('/', inventoryController.getAllInventory);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/:id', inventoryController.getInventoryById);
router.post('/stock-in', inventoryController.stockIn);
router.post('/stock-out', inventoryController.stockOut);

export default router;

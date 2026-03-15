import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authenticate, requireAdmin } from '../middleware/auth';


const router = Router();

router.get('/', authenticate, productController.getAllProducts);  // Must be logged in
router.get('/:id', authenticate, productController.getProductById);//need to check correctly if user is admin or staff
router.post('/', authenticate, requireAdmin, productController.createProduct);  // Admin only
router.put('/:id', authenticate, requireAdmin, productController.updateProduct);  // Admin only
router.delete('/:id', authenticate, requireAdmin, productController.deleteProduct);

export default router;

import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (auth required)
router.get('/me', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

// Admin-only routes
router.get('/users', authenticate, requireAdmin, authController.getAllUsers);
router.delete('/users/:id', authenticate, requireAdmin, authController.deleteUser);

export default router;
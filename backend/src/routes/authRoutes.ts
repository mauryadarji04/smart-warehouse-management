import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes (auth required)
router.get('/me', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

// Admin-only routes
router.get('/users', authenticate, requireAdmin, authController.getAllUsers);
router.delete('/users/:id', authenticate, requireAdmin, authController.deleteUser);

export default router;
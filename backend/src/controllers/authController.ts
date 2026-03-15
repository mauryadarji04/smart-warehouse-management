import { Request, Response } from 'express';
import { sendSuccess, sendError, sendCreated } from '../utils/response';
import { AppError } from '../utils/AppError';
import * as authService from '../services/authService';

// POST /api/auth/register — Create new account
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password required', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters', 400);
    }

    // Register user
    const { user, token } = await authService.registerUser(
      name,
      email,
      password,
      role || 'STAFF'
    );

    sendCreated(res, { user, token }, 'Account created successfully');
  } catch (err: any) {
    if (err.message === 'Email already registered') {
      return sendError(res, err.message, 400);
    }
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Registration failed', 500);
  }
};

// POST /api/auth/login — Login with email/password
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password required', 400);
    }

    const { user, token } = await authService.loginUser(email, password);

    sendSuccess(res, { user, token }, 'Login successful');
  } catch (err: any) {
    if (err.message === 'Invalid email or password') {
      return sendError(res, err.message, 401);
    }
    sendError(res, 'Login failed', 500);
  }
};

// GET /api/auth/me — Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    // User ID comes from auth middleware (req.user)
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const user = await authService.getUserById(userId);
    sendSuccess(res, user);
  } catch (err: any) {
    if (err.message === 'User not found') {
      return sendError(res, err.message, 404);
    }
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to get profile', 500);
  }
};

// PUT /api/auth/profile — Update current user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const { name, email, password } = req.body;

    const user = await authService.updateUser(userId, { name, email, password });

    sendSuccess(res, user, 'Profile updated successfully');
  } catch (err: any) {
    if (err.message === 'Email already in use') {
      return sendError(res, err.message, 400);
    }
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to update profile', 500);
  }
};

// GET /api/auth/users — Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await authService.getAllUsers();
    sendSuccess(res, users);
  } catch (err) {
    sendError(res, 'Failed to fetch users', 500);
  }
};

// DELETE /api/auth/users/:id — Delete user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user?.userId;

    // Prevent deleting yourself
    if (id === currentUserId) {
      throw new AppError('Cannot delete your own account', 400);
    }

    await authService.deleteUser(id);
    sendSuccess(res, null, 'User deleted successfully');
  } catch (err: any) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to delete user', 500);
  }
};
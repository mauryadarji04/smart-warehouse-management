import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { sendOTPEmail } from '../utils/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// In-memory OTP store: email -> { otp, expiresAt }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

/**
 * Generate JWT token
 */
export const generateToken = (userId: string, email: string, role: string): string => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Register new user
 */
export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: 'ADMIN' | 'STAFF' = 'STAFF'
) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate token
  const token = generateToken(user.id, user.email, user.role);

  return { user, token };
};

/**
 * Login user
 */
export const loginUser = async (email: string, password: string) => {
  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate token
  const token = generateToken(user.id, user.email, user.role);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Update user profile
 */
export const updateUser = async (
  userId: string,
  data: { name?: string; email?: string; password?: string }
) => {
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.email) {
    // Check if email is already taken by another user
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: userId } },
    });
    if (existing) {
      throw new Error('Email already in use');
    }
    updateData.email = data.email;
  }
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (userId: string) => {
  await prisma.user.delete({ where: { id: userId } });
  return true;
};

/**
 * Send OTP to email for password reset
 */
export const sendPasswordResetOTP = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('No account found with this email');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

  await sendOTPEmail(email, otp);
};

/**
 * Verify OTP and reset password
 */
export const resetPasswordWithOTP = async (email: string, otp: string, newPassword: string) => {
  const record = otpStore.get(email);

  if (!record) throw new Error('OTP not found. Please request a new one');
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    throw new Error('OTP has expired. Please request a new one');
  }
  if (record.otp !== otp) throw new Error('Invalid OTP');

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({ where: { email }, data: { password: hashedPassword } });

  otpStore.delete(email);
};
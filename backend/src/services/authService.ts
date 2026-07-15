import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { sendOTPEmail } from '../utils/emailService';
import { redis } from '../utils/redis';

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

if (!ACCESS_SECRET) throw new Error('JWT_SECRET env variable is required');
if (!REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET env variable is required');

export const generateAccessToken = (userId: string, email: string, role: string): string =>
  jwt.sign({ userId, email, role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });

export const generateRefreshToken = (): string => crypto.randomBytes(40).toString('hex');

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: 'ADMIN' | 'STAFF' = 'STAFF'
) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('Email already registered');

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = await createRefreshToken(user.id);

  return { user, accessToken, refreshToken };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid email or password');

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) throw new Error('Invalid email or password');

  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const refreshToken = await createRefreshToken(user.id);

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

export const createRefreshToken = async (userId: string): Promise<string> => {
  const token = generateRefreshToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_IN_MS);

  await prisma.refreshToken.create({ data: { tokenHash, userId, expiresAt } });
  return token;
};

export const rotateRefreshToken = async (incomingToken: string) => {
  const tokenHash = hashToken(incomingToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.expiresAt < new Date()) {
    // If expired or not found, revoke all tokens for that user (token reuse attack)
    if (stored) await prisma.refreshToken.deleteMany({ where: { userId: stored.userId } });
    throw new Error('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) throw new Error('User not found');

  // Delete old token and issue new pair (rotation)
  await prisma.refreshToken.delete({ where: { tokenHash } });

  const accessToken = generateAccessToken(user.id, user.email, user.role);
  const newRefreshToken = await createRefreshToken(user.id);

  return { user, accessToken, refreshToken: newRefreshToken };
};

export const revokeRefreshToken = async (incomingToken: string): Promise<void> => {
  const tokenHash = hashToken(incomingToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
};

export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) throw new Error('User not found');
  return user;
};

export const updateUser = async (
  userId: string,
  data: { name?: string; email?: string; password?: string }
) => {
  const updateData: any = {};

  if (data.name) updateData.name = data.name;
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: userId } },
    });
    if (existing) throw new Error('Email already in use');
    updateData.email = data.email;
  }
  if (data.password) {
    updateData.password = await hashPassword(data.password);
    // Revoke all refresh tokens on password change
    await revokeAllUserTokens(userId);
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
};

export const getAllUsers = async () =>
  prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

export const deleteUser = async (userId: string) => {
  await prisma.user.delete({ where: { id: userId } });
};

export const sendPasswordResetOTP = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('No account found with this email');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Store OTP in Redis with 10-minute TTL (falls back gracefully if Redis is down)
  try {
    await redis.set(`otp:${email}`, otp, 'EX', 600);
  } catch {
    throw new Error('OTP service temporarily unavailable');
  }
  await sendOTPEmail(email, otp);
};

export const resetPasswordWithOTP = async (email: string, otp: string, newPassword: string) => {
  let storedOtp: string | null = null;
  try {
    storedOtp = await redis.get(`otp:${email}`);
  } catch {
    throw new Error('OTP service temporarily unavailable');
  }

  if (!storedOtp) throw new Error('OTP not found or expired. Please request a new one');
  if (storedOtp !== otp) throw new Error('Invalid OTP');

  const hashedPassword = await hashPassword(newPassword);
  const user = await prisma.user.update({ where: { email }, data: { password: hashedPassword }, select: { id: true } });

  // Revoke all sessions on password reset
  await revokeAllUserTokens(user.id);
  await redis.del(`otp:${email}`);
};

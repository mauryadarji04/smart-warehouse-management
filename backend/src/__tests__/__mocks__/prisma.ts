// Prisma mock — prevents real DB connections in unit tests
export const prisma = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  refreshToken: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  product: { findMany: jest.fn(), findUnique: jest.fn() },
  inventory: { findMany: jest.fn(), aggregate: jest.fn() },
  salesHistory: { findMany: jest.fn() },
};

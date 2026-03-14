import { prisma } from '../utils/prisma';

/**
 * Check for expiring or expired inventory items
 * Creates alerts for items expiring soon
 */
export const checkExpiringItems = async () => {
  console.log('[EXPIRY SERVICE] Starting expiry check...');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Critical threshold: 7 days
    const criticalDate = new Date(today);
    criticalDate.setDate(criticalDate.getDate() + 7);

    // Warning threshold: 30 days
    const warningDate = new Date(today);
    warningDate.setDate(warningDate.getDate() + 30);

    // Get all inventory with expiry dates
    const inventory = await prisma.inventory.findMany({
      where: {
        expiryDate: { not: null },
        quantity: { gt: 0 }, // Only items in stock
      },
      include: {
        product: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    let expiredCount = 0;
    let criticalCount = 0;
    let warningCount = 0;

    for (const item of inventory) {
      if (!item.expiryDate) continue;

      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);

      // Already expired
      if (expiryDate < today) {
        // Create critical alert
        await createExpiryAlert(
          item.productId,
          'EXPIRY_CRITICAL',
          `EXPIRED: ${item.product.name} (Batch: ${item.batchNo}) expired on ${expiryDate.toLocaleDateString()}. Quantity: ${item.quantity}`
        );
        expiredCount++;
      }
      // Critical (expires within 7 days)
      else if (expiryDate <= criticalDate) {
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        await createExpiryAlert(
          item.productId,
          'EXPIRY_CRITICAL',
          `URGENT: ${item.product.name} (Batch: ${item.batchNo}) expires in ${daysLeft} day(s). Quantity: ${item.quantity}`
        );
        criticalCount++;
      }
      // Warning (expires within 30 days)
      else if (expiryDate <= warningDate) {
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        await createExpiryAlert(
          item.productId,
          'EXPIRY_WARNING',
          `${item.product.name} (Batch: ${item.batchNo}) expires in ${daysLeft} day(s). Quantity: ${item.quantity}`
        );
        warningCount++;
      }
    }

    console.log(`[EXPIRY SERVICE] Complete: ${expiredCount} expired, ${criticalCount} critical, ${warningCount} warnings`);

    return { expiredCount, criticalCount, warningCount };
  } catch (error) {
    console.error('[EXPIRY SERVICE] Error:', error);
    throw error;
  }
};

/**
 * Helper: Create expiry alert (avoid duplicates)
 */
const createExpiryAlert = async (productId: string, type: 'EXPIRY_WARNING' | 'EXPIRY_CRITICAL', message: string) => {
  // Check if similar alert already exists (same product, type, unread)
  const existing = await prisma.alert.findFirst({
    where: {
      productId,
      type,
      isRead: false,
      message: { contains: message.split('(Batch:')[1]?.split(')')[0] || '' }, // Match by batch
    },
  });

  if (!existing) {
    await prisma.alert.create({
      data: {
        productId,
        type,
        message,
      },
    });
  }
};

/**
 * Get all items expiring soon
 */
export const getExpiringItems = async (daysAhead: number = 30) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const items = await prisma.inventory.findMany({
      where: {
        expiryDate: {
          not: null,
          lte: targetDate,
        },
        quantity: { gt: 0 },
      },
      include: {
        product: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    // Calculate days until expiry for each item
    return items.map((item) => {
      const expiryDate = new Date(item.expiryDate!);
      expiryDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...item,
        daysUntilExpiry: daysLeft,
        status: daysLeft < 0 ? 'EXPIRED' : daysLeft <= 7 ? 'CRITICAL' : 'WARNING',
      };
    });
  } catch (error) {
    console.error('Failed to get expiring items:', error);
    throw error;
  }
};

/**
 * Remove expired stock
 */
export const removeExpiredStock = async (inventoryId: string, reason?: string) => {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: { product: true },
    });

    if (!inventory) {
      throw new Error('Inventory batch not found');
    }

    // Create transaction for removal
    await prisma.$transaction([
      // Set quantity to 0
      prisma.inventory.update({
        where: { id: inventoryId },
        data: { quantity: 0 },
      }),
      // Log the removal
      prisma.inventoryTransaction.create({
        data: {
          inventoryId,
          type: 'EXPIRED_REMOVAL',
          quantity: -inventory.quantity,
          reason: reason || `Expired on ${inventory.expiryDate?.toLocaleDateString()}`,
        },
      }),
    ]);

    console.log(`Removed expired stock: ${inventory.product.name} (Batch: ${inventory.batchNo}), Qty: ${inventory.quantity}`);

    return true;
  } catch (error) {
    console.error('Failed to remove expired stock:', error);
    throw error;
  }
};

/**
 * Get expiry statistics
 */
export const getExpiryStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);

    const thirtyDays = new Date(today);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const [expired, critical, warning, total] = await Promise.all([
      // Expired (past date)
      prisma.inventory.count({
        where: {
          expiryDate: { not: null, lt: today },
          quantity: { gt: 0 },
        },
      }),
      // Critical (0-7 days)
      prisma.inventory.count({
        where: {
          expiryDate: { not: null, gte: today, lte: sevenDays },
          quantity: { gt: 0 },
        },
      }),
      // Warning (8-30 days)
      prisma.inventory.count({
        where: {
          expiryDate: { not: null, gt: sevenDays, lte: thirtyDays },
          quantity: { gt: 0 },
        },
      }),
      // Total items with expiry dates
      prisma.inventory.count({
        where: {
          expiryDate: { not: null },
          quantity: { gt: 0 },
        },
      }),
    ]);

    return {
      expired,
      critical,
      warning,
      safe: total - expired - critical - warning,
      total,
    };
  } catch (error) {
    console.error('Failed to get expiry stats:', error);
    throw error;
  }
};
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError, sendCreated } from '../utils/response';
import { AppError } from '../utils/AppError';

// GET /api/inventory — list all inventory batches
export const getAllInventory = async (_req: Request, res: Response) => {
  try {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: {
          include: { supplier: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, inventory);
  } catch (err) {
    sendError(res, 'Failed to fetch inventory', 500);
  }
};

// GET /api/inventory/:id — single batch details
export const getInventoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: {
        product: { include: { supplier: true } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!inventory) throw new AppError('Inventory batch not found', 404);
    sendSuccess(res, inventory);
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to fetch inventory', 500);
  }
};

// POST /api/inventory/stock-in — add stock (create batch)
export const stockIn = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, batchNo, expiryDate, location, reason, reference } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      throw new AppError('Product ID and positive quantity required', 400);
    }

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found', 404);

    // Create or update inventory batch
    const inventory = await prisma.inventory.create({
      data: {
        productId,
        quantity: parseInt(quantity),
        batchNo: batchNo || `BATCH-${Date.now()}`,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        location: location || null,
      },
    });

    // Log transaction
    await prisma.inventoryTransaction.create({
      data: {
        inventoryId: inventory.id,
        type: 'STOCK_IN',
        quantity: parseInt(quantity),
        reason: reason || 'Stock in',
        reference: reference || null,
      },
    });

    // Check if this brings stock above reorder point (clear alert if needed)
    const totalStock = await prisma.inventory.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });

    if ((totalStock._sum.quantity || 0) >= product.reorderPoint) {
      // Mark low stock alerts as read
      await prisma.alert.updateMany({
        where: { productId, type: 'LOW_STOCK', isRead: false },
        data: { isRead: true },
      });
    }

    sendCreated(res, inventory, 'Stock added successfully');
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to add stock', 500);
  }
};

// POST /api/inventory/stock-out — remove stock
export const stockOut = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, reason, reference } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      throw new AppError('Product ID and positive quantity required', 400);
    }

    // Get available inventory batches (FIFO: oldest first)
    const batches = await prisma.inventory.findMany({
      where: { productId, quantity: { gt: 0 } },
      orderBy: { createdAt: 'asc' },
    });

    const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);
    if (totalAvailable < quantity) {
      throw new AppError(`Insufficient stock. Available: ${totalAvailable}`, 400);
    }

    let remaining = parseInt(quantity);
    const updates = [];

    // Deduct from batches (FIFO)
    for (const batch of batches) {
      if (remaining <= 0) break;

      const deduct = Math.min(batch.quantity, remaining);
      const newQty = batch.quantity - deduct;

      updates.push(
        prisma.inventory.update({
          where: { id: batch.id },
          data: { quantity: newQty },
        })
      );

      updates.push(
        prisma.inventoryTransaction.create({
          data: {
            inventoryId: batch.id,
            type: 'STOCK_OUT',
            quantity: -deduct,
            reason: reason || 'Stock out',
            reference: reference || null,
          },
        })
      );

      remaining -= deduct;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ✅ PHASE 4 ADDITION: Record sale for demand forecasting
    // This must be inside the transaction to ensure atomicity
    // ═══════════════════════════════════════════════════════════════════
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    updates.push(
      prisma.salesHistory.upsert({
        where: {
          productId_date: {
            productId,
            date: today,
          },
        },
        update: {
          quantity: { increment: parseInt(quantity) },
        },
        create: {
          productId,
          date: today,
          quantity: parseInt(quantity),
        },
      })
    );
    // ═══════════════════════════════════════════════════════════════════
    // END PHASE 4 ADDITION
    // ═══════════════════════════════════════════════════════════════════

    // Execute all updates in a single transaction (atomicity guaranteed)
    await prisma.$transaction(updates);

    // Check if stock fell below reorder point → trigger alert
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product) {
      const newTotal = totalAvailable - parseInt(quantity);
      if (newTotal < product.reorderPoint) {
        // Create low stock alert if not already exists
        const existingAlert = await prisma.alert.findFirst({
          where: { productId, type: 'LOW_STOCK', isRead: false },
        });

        if (!existingAlert) {
          await prisma.alert.create({
            data: {
              productId,
              type: 'LOW_STOCK',
              message: `Stock level (${newTotal}) below reorder point (${product.reorderPoint})`,
            },
          });
        }
      }
    }

    sendSuccess(res, { quantityRemoved: parseInt(quantity) }, 'Stock removed successfully');
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to remove stock', 500);
  }
};

// GET /api/inventory/low-stock — products below reorder point
export const getLowStock = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: { select: { quantity: true } },
        supplier: true,
      },
    });

    const lowStockProducts = products
      .map((p) => {
        const totalQty = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
        return { ...p, totalQuantity: totalQty, inventory: undefined };
      })
      .filter((p) => p.totalQuantity < p.reorderPoint);

    sendSuccess(res, lowStockProducts);
  } catch (err) {
    sendError(res, 'Failed to fetch low stock products', 500);
  }
};
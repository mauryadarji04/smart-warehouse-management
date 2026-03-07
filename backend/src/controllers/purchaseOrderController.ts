import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError, sendCreated } from '../utils/response';
import { AppError } from '../utils/AppError';

// GET /api/purchase-orders — list all POs
export const getAllPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const where = status ? { status: status as any } : {};

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, orders);
  } catch (err) {
    sendError(res, 'Failed to fetch purchase orders', 500);
  }
};

// GET /api/purchase-orders/:id — single PO details
export const getPurchaseOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) throw new AppError('Purchase order not found', 404);
    sendSuccess(res, order);
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to fetch purchase order', 500);
  }
};

// POST /api/purchase-orders — create new PO
export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { supplierId, items, expectedDelivery, notes } = req.body;

    if (!supplierId || !items || items.length === 0) {
      throw new AppError('Supplier and items are required', 400);
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new AppError('Supplier not found', 404);

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new AppError(`Product ${item.productId} not found`, 404);

      const quantity = parseInt(item.quantity);
      const unitCost = parseFloat(item.unitCost || product.costPrice);
      const totalCost = quantity * unitCost;

      totalAmount += totalCost;

      orderItems.push({
        productId: item.productId,
        quantity,
        unitCost,
        totalCost,
      });
    }

    // Create PO with items
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        supplierId,
        status: 'DRAFT',
        totalAmount,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        notes: notes || null,
        items: {
          create: orderItems,
        },
      },
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
      },
    });

    sendCreated(res, purchaseOrder, 'Purchase order created successfully');
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to create purchase order', 500);
  }
};

// PATCH /api/purchase-orders/:id/status — update PO status
export const updatePurchaseOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['DRAFT', 'ORDERED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status,
        receivedAt: status === 'RECEIVED' ? new Date() : undefined,
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    sendSuccess(res, order, 'Status updated successfully');
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to update status', 500);
  }
};

// POST /api/purchase-orders/:id/receive — receive PO (auto stock-in)
export const receivePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { batchPrefix, location } = req.body;

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) throw new AppError('Purchase order not found', 404);
    if (order.status === 'RECEIVED') throw new AppError('Order already received', 400);

    const operations = [];

    // Create inventory batches for each item
    for (const item of order.items) {
      const batchNo = `${batchPrefix || 'PO'}-${order.poNumber}-${item.product.sku}`;

      // Create inventory batch
      const inventory = await prisma.inventory.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          batchNo,
          location: location || null,
        },
      });

      // Log transaction
      operations.push(
        prisma.inventoryTransaction.create({
          data: {
            inventoryId: inventory.id,
            type: 'STOCK_IN',
            quantity: item.quantity,
            reason: 'Purchase order received',
            reference: order.poNumber,
          },
        })
      );
    }

    // Execute all operations and update PO status
    await prisma.$transaction([
      ...operations,
      prisma.purchaseOrder.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
        },
      }),
    ]);

    const updatedOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    sendSuccess(res, updatedOrder, 'Purchase order received and stock updated');
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to receive purchase order', 500);
  }
};

// DELETE /api/purchase-orders/:id — delete PO
export const deletePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!order) throw new AppError('Purchase order not found', 404);

    if (order.status === 'RECEIVED') {
      throw new AppError('Cannot delete received orders', 400);
    }

    await prisma.purchaseOrder.delete({ where: { id } });
    sendSuccess(res, null, 'Purchase order deleted successfully');
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to delete purchase order', 500);
  }
};
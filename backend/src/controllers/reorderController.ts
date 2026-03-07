import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { checkAndCreatePurchaseOrders, calculateEOQ, calculateReorderPoint } from '../services/reorderService';
import { prisma } from '../utils/prisma';

// POST /api/reorder/check — manually trigger reorder check
export const triggerReorderCheck = async (_req: Request, res: Response) => {
  try {
    const result = await checkAndCreatePurchaseOrders();
    
    sendSuccess(res, result, `Reorder check complete: ${result.ordersCreated} orders created`);
  } catch (err) {
    console.error('Reorder check failed:', err);
    sendError(res, 'Failed to run reorder check', 500);
  }
};

// GET /api/reorder/preview — preview what would be ordered (dry run)
export const previewReorders = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        supplier: true,
        inventory: { select: { quantity: true } },
      },
    });

    const preview = [];

    for (const product of products) {
      const currentStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);

      if (currentStock < product.reorderPoint && product.supplier) {
        const annualDemand = product.avgDailyDemand * 365;
        const eoq = calculateEOQ(annualDemand, product.orderingCost, product.holdingCost);
        const orderQuantity = eoq > 0 ? eoq : product.reorderQty;

        preview.push({
          product: {
            id: product.id,
            sku: product.sku,
            name: product.name,
          },
          currentStock,
          reorderPoint: product.reorderPoint,
          supplier: product.supplier.name,
          recommendedOrderQty: orderQuantity,
          eoqCalculated: eoq,
          estimatedCost: orderQuantity * product.costPrice,
          reason: currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        });
      }
    }

    sendSuccess(res, {
      productsNeedingReorder: preview.length,
      preview,
    });
  } catch (err) {
    sendError(res, 'Failed to generate reorder preview', 500);
  }
};

// POST /api/reorder/calculate-eoq — calculate EOQ for a product
export const calculateProductEOQ = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { supplier: true },
    });

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    const annualDemand = product.avgDailyDemand * 365;
    const eoq = calculateEOQ(annualDemand, product.orderingCost, product.holdingCost);

    const reorderPoint = product.supplier
      ? calculateReorderPoint(product.avgDailyDemand, product.supplier.leadTimeDays)
      : product.reorderPoint;

    sendSuccess(res, {
      product: {
        name: product.name,
        sku: product.sku,
      },
      calculations: {
        annualDemand,
        dailyDemand: product.avgDailyDemand,
        eoq,
        currentReorderQty: product.reorderQty,
        recommendedReorderQty: eoq > 0 ? eoq : product.reorderQty,
        reorderPoint,
        orderingCost: product.orderingCost,
        holdingCost: product.holdingCost,
      },
    });
  } catch (err) {
    sendError(res, 'Failed to calculate EOQ', 500);
  }
};
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError, sendCreated } from '../utils/response';
import { AppError } from '../utils/AppError';

// GET /api/products — list all products with current stock
export const getAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        supplier: true,
        inventory: {
          select: { quantity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const productsWithStock = products.map((p) => ({
      ...p,
      totalQuantity: p.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
      inventory: undefined,
    }));

    sendSuccess(res, productsWithStock);
  } catch (err) {
    sendError(res, 'Failed to fetch products', 500);
  }
};

// GET /api/products/:id — single product with full inventory details
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        supplier: true,
        inventory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) throw new AppError('Product not found', 404);

    const totalQuantity = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    sendSuccess(res, { ...product, totalQuantity });
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to fetch product', 500);
  }
};

// POST /api/products — create new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      sku,
      name,
      description,
      category,
      unit,
      costPrice,
      sellingPrice,
      reorderPoint,
      reorderQty,
      orderingCost,
      holdingCost,
      avgDailyDemand,
      supplierId,
    } = req.body;

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) throw new AppError('SKU already exists', 400);

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        category,
        unit: unit || 'unit',
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        reorderPoint: parseInt(reorderPoint) || 10,
        reorderQty: parseInt(reorderQty) || 50,
        orderingCost: parseFloat(orderingCost) || 50,
        holdingCost: parseFloat(holdingCost) || 2,
        avgDailyDemand: parseFloat(avgDailyDemand) || 5,
        supplierId: supplierId || null,
      },
      include: { supplier: true },
    });

    sendCreated(res, product, 'Product created successfully');
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to create product', 500);
  }
};

// PUT /api/products/:id — update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      sku,
      name,
      description,
      category,
      unit,
      costPrice,
      sellingPrice,
      reorderPoint,
      reorderQty,
      orderingCost,
      holdingCost,
      avgDailyDemand,
      supplierId,
    } = req.body;

    if (sku) {
      const existing = await prisma.product.findFirst({
        where: { sku, NOT: { id } },
      });
      if (existing) throw new AppError('SKU already exists', 400);
    }

    const updateData: any = {};
    
    if (sku !== undefined) updateData.sku = sku;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (category !== undefined) updateData.category = category || null;
    if (unit !== undefined) updateData.unit = unit;
    if (costPrice !== undefined) updateData.costPrice = parseFloat(costPrice);
    if (sellingPrice !== undefined) updateData.sellingPrice = parseFloat(sellingPrice);
    if (reorderPoint !== undefined) updateData.reorderPoint = parseInt(reorderPoint);
    if (reorderQty !== undefined) updateData.reorderQty = parseInt(reorderQty);
    if (orderingCost !== undefined) updateData.orderingCost = parseFloat(orderingCost);
    if (holdingCost !== undefined) updateData.holdingCost = parseFloat(holdingCost);
    if (avgDailyDemand !== undefined) updateData.avgDailyDemand = parseFloat(avgDailyDemand);
    if (supplierId !== undefined) updateData.supplierId = supplierId || null;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { supplier: true },
    });

    sendSuccess(res, product, 'Product updated successfully');
  } catch (err) {
    console.error('Update product error:', err);
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to update product', 500);
  }
};

// DELETE /api/products/:id — delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const inventory = await prisma.inventory.findFirst({ where: { productId: id } });
    if (inventory && inventory.quantity > 0) {
      throw new AppError('Cannot delete product with existing inventory', 400);
    }

    await prisma.product.delete({ where: { id } });
    sendSuccess(res, null, 'Product deleted successfully');
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to delete product', 500);
  }
};
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError, sendCreated } from '../utils/response';
import { AppError } from '../utils/AppError';

// GET /api/suppliers — list all suppliers
export const getAllSuppliers = async (_req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { products: true, purchaseOrders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, suppliers);
  } catch (err) {
    sendError(res, 'Failed to fetch suppliers', 500);
  }
};

// GET /api/suppliers/:id — single supplier with products and orders
export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: true,
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) throw new AppError('Supplier not found', 404);
    sendSuccess(res, supplier);
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to fetch supplier', 500);
  }
};

// POST /api/suppliers — create new supplier
export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, leadTimeDays } = req.body;

    if (!name) throw new AppError('Supplier name is required', 400);

    const supplier = await prisma.supplier.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        leadTimeDays: parseInt(leadTimeDays) || 7,
      },
    });

    sendCreated(res, supplier, 'Supplier created successfully');
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to create supplier', 500);
  }
};

// PUT /api/suppliers/:id — update supplier
export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        leadTimeDays: data.leadTimeDays ? parseInt(data.leadTimeDays) : undefined,
      },
    });

    sendSuccess(res, supplier, 'Supplier updated successfully');
  } catch (err) {
    sendError(res, 'Failed to update supplier', 500);
  }
};

// DELETE /api/suppliers/:id — delete supplier
export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if supplier has products or orders
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, purchaseOrders: true } },
      },
    });

    if (!supplier) throw new AppError('Supplier not found', 404);

    if (supplier._count.products > 0 || supplier._count.purchaseOrders > 0) {
      throw new AppError(
        'Cannot delete supplier with existing products or purchase orders',
        400
      );
    }

    await prisma.supplier.delete({ where: { id } });
    sendSuccess(res, null, 'Supplier deleted successfully');
  } catch (err) {
    if (err instanceof AppError) return sendError(res, err.message, err.statusCode);
    sendError(res, 'Failed to delete supplier', 500);
  }
};
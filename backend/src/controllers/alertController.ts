import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/alerts — list all alerts (unread first)
export const getAllAlerts = async (req: Request, res: Response) => {
  try {
    const { isRead } = req.query;

    const where = isRead !== undefined ? { isRead: isRead === 'true' } : {};

    const alerts = await prisma.alert.findMany({
      where,
      include: { product: true },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
    });

    sendSuccess(res, alerts);
  } catch (err) {
    sendError(res, 'Failed to fetch alerts', 500);
  }
};

// PATCH /api/alerts/:id/read — mark alert as read
export const markAlertAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });

    sendSuccess(res, alert, 'Alert marked as read');
  } catch (err) {
    sendError(res, 'Failed to update alert', 500);
  }
};

// PATCH /api/alerts/read-all — mark all alerts as read
export const markAllAlertsAsRead = async (_req: Request, res: Response) => {
  try {
    await prisma.alert.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    sendSuccess(res, null, 'All alerts marked as read');
  } catch (err) {
    sendError(res, 'Failed to mark alerts as read', 500);
  }
};

// GET /api/alerts/stats — count by type and read status
export const getAlertStats = async (_req: Request, res: Response) => {
  try {
    const total = await prisma.alert.count();
    const unread = await prisma.alert.count({ where: { isRead: false } });

    const byType = await prisma.alert.groupBy({
      by: ['type'],
      _count: { type: true },
      where: { isRead: false },
    });

    sendSuccess(res, { total, unread, byType });
  } catch (err) {
    sendError(res, 'Failed to fetch alert stats', 500);
  }
};

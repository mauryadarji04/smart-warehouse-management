import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import * as analyticsService from '../services/analyticsService';

// GET /api/analytics/inventory-value
export const getInventoryValue = async (_req: Request, res: Response) => {
  try {
    const data = await analyticsService.getInventoryValue();
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, 'Failed to calculate inventory value', 500);
  }
};

// GET /api/analytics/abc-analysis
export const getABCAnalysis = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 90;
    const data = await analyticsService.getABCAnalysis(days);
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, 'Failed to perform ABC analysis', 500);
  }
};

// GET /api/analytics/stock-turnover
export const getStockTurnover = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 90;
    const data = await analyticsService.getStockTurnover(days);
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, 'Failed to calculate stock turnover', 500);
  }
};

// GET /api/analytics/forecast-accuracy
export const getForecastAccuracy = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await analyticsService.getForecastAccuracy(days);
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, 'Failed to get forecast accuracy', 500);
  }
};

// GET /api/analytics/sales-trends
export const getSalesTrends = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await analyticsService.getSalesTrends(days);
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, 'Failed to get sales trends', 500);
  }
};

// GET /api/analytics/top-products
export const getTopProducts = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await analyticsService.getTopSellingProducts(days, limit);
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, 'Failed to get top products', 500);
  }
};

// GET /api/analytics/dashboard
export const getDashboard = async (_req: Request, res: Response) => {
  try {
    const data = await analyticsService.getDashboardSummary();
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, 'Failed to get dashboard data', 500);
  }
};


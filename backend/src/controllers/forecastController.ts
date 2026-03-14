import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { runNightlyForecast, forecastProductDemand, recordSale } from '../services/forecastingService';
import { prisma } from '../utils/prisma';

// POST /api/forecasts/run — manually trigger forecast generation
export const triggerForecast = async (_req: Request, res: Response) => {
  try {
    const result = await runNightlyForecast();
    sendSuccess(res, result, `Forecast complete: ${result.productsProcessed} products processed`);
  } catch (err) {
    console.error('Forecast failed:', err);
    sendError(res, 'Failed to run forecast', 500);
  }
};

// GET /api/forecasts/:productId — get forecasts for a product
export const getProductForecasts = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const forecasts = await prisma.demandForecast.findMany({
      where: { productId },
      orderBy: { forecastDate: 'asc' },
      take: 30, // Last 30 days
      include: { product: true },
    });

    sendSuccess(res, forecasts);
  } catch (err) {
    sendError(res, 'Failed to fetch forecasts', 500);
  }
};

// POST /api/forecasts/record-sale — manually record a sale
export const recordSaleManually = async (req: Request, res: Response) => {
  try {
    const { productId, quantity, date } = req.body;

    if (!productId || !quantity) {
      return sendError(res, 'Product ID and quantity required', 400);
    }

    const saleDate = date ? new Date(date) : new Date();
    await recordSale(productId, parseInt(quantity), saleDate);

    sendSuccess(res, null, 'Sale recorded successfully');
  } catch (err) {
    sendError(res, 'Failed to record sale', 500);
  }
};

// GET /api/forecasts/accuracy — get forecast accuracy stats
export const getForecastAccuracy = async (_req: Request, res: Response) => {
  try {
    const forecasts = await prisma.demandForecast.findMany({
      where: {
        actualQty: { not: null },
      },
      select: {
        productId: true,
        product: { select: { name: true, sku: true } },
        forecastDate: true,
        predictedQty: true,
        actualQty: true,
      },
      orderBy: { forecastDate: 'desc' },
      take: 100,
    });

    // Calculate accuracy metrics
    const stats = forecasts.map((f) => {
      const error = Math.abs(f.predictedQty - (f.actualQty || 0));
      const percentError = f.actualQty ? (error / f.actualQty) * 100 : 0;

      return {
        ...f,
        error,
        percentError: Math.round(percentError * 10) / 10,
      };
    });

    const avgError = stats.reduce((sum, s) => sum + s.error, 0) / stats.length;
    const avgPercentError = stats.reduce((sum, s) => sum + s.percentError, 0) / stats.length;

    sendSuccess(res, {
      forecasts: stats,
      summary: {
        totalForecasts: stats.length,
        avgError: Math.round(avgError * 10) / 10,
        avgPercentError: Math.round(avgPercentError * 10) / 10,
      },
    });
  } catch (err) {
    sendError(res, 'Failed to fetch forecast accuracy', 500);
  }
};


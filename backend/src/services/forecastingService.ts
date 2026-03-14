import { prisma } from '../utils/prisma';

/**
 * Simple Moving Average (SMA) Formula:
 * SMA = (Sum of last N days sales) / N
 * 
 * We use 7-day moving average for short-term forecasting.
 */
export const calculateMovingAverage = (salesData: number[], period: number = 7): number => {
  if (salesData.length === 0) return 0;
  
  const recentSales = salesData.slice(-period);
  const sum = recentSales.reduce((acc, val) => acc + val, 0);
  
  return sum / recentSales.length;
};

/**
 * Record a sale for forecasting purposes
 */
export const recordSale = async (productId: string, quantity: number, date: Date = new Date()) => {
  const saleDate = new Date(date);
  saleDate.setHours(0, 0, 0, 0); // Normalize to start of day

  try {
    // Upsert sales history (update if exists for this date, create if not)
    await prisma.salesHistory.upsert({
      where: {
        productId_date: {
          productId,
          date: saleDate,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        productId,
        date: saleDate,
        quantity,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to record sale:', error);
    return false;
  }
};

/**
 * Generate forecast for a single product
 */
export const forecastProductDemand = async (
  productId: string,
  forecastDays: number = 7,
  lookbackDays: number = 30
): Promise<any[]> => {
  try {
    // Get historical sales data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    const salesHistory = await prisma.salesHistory.findMany({
      where: {
        productId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    if (salesHistory.length === 0) {
      return []; // No historical data to forecast from
    }

    // Extract quantities
    const quantities = salesHistory.map((s) => s.quantity);

    // Calculate moving average
    const avgDemand = calculateMovingAverage(quantities, 7);

    // Generate forecasts for next N days
    const forecasts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);

      forecasts.push({
        productId,
        forecastDate,
        predictedQty: Math.round(avgDemand * 10) / 10, // Round to 1 decimal
        algorithm: 'MOVING_AVG_7D',
      });
    }

    return forecasts;
  } catch (error) {
    console.error('Forecast generation failed:', error);
    throw error;
  }
};

/**
 * Run nightly forecast for all products
 */
export const runNightlyForecast = async () => {
  console.log('[FORECAST SERVICE] Starting nightly forecast...');

  try {
    // Get all active products
    const products = await prisma.product.findMany({
      select: { id: true, name: true, sku: true },
    });

    let forecastsCreated = 0;
    let productsProcessed = 0;

    for (const product of products) {
      try {
        // Generate forecasts
        const forecasts = await forecastProductDemand(product.id, 7, 30);

        if (forecasts.length === 0) {
          console.log(`⚠️  ${product.name}: No sales history for forecasting`);
          continue;
        }

        // Save forecasts to database
        for (const forecast of forecasts) {
          await prisma.demandForecast.upsert({
            where: {
              productId_forecastDate: {
                productId: forecast.productId,
                forecastDate: forecast.forecastDate,
              },
            },
            update: {
              predictedQty: forecast.predictedQty,
              algorithm: forecast.algorithm,
            },
            create: forecast,
          });
        }

        // Update product's avgDailyDemand based on forecast
        const avgDaily = forecasts[0].predictedQty;
        await prisma.product.update({
          where: { id: product.id },
          data: { avgDailyDemand: avgDaily },
        });

        console.log(`✅ ${product.name}: Forecasted ${avgDaily.toFixed(1)} units/day (7-day avg)`);
        forecastsCreated += forecasts.length;
        productsProcessed++;
      } catch (err) {
        console.error(`❌ ${product.name}: Forecast failed`, err);
      }
    }

    console.log(`[FORECAST SERVICE] Complete: ${forecastsCreated} forecasts for ${productsProcessed} products`);

    return { forecastsCreated, productsProcessed };
  } catch (error) {
    console.error('[FORECAST SERVICE] Error:', error);
    throw error;
  }
};

/**
 * Update forecast accuracy by comparing predictions with actual sales
 */
export const updateForecastAccuracy = async () => {
  console.log('[FORECAST SERVICE] Updating forecast accuracy...');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  try {
    // Get forecasts for yesterday
    const forecasts = await prisma.demandForecast.findMany({
      where: {
        forecastDate: yesterday,
        actualQty: null, // Not yet updated
      },
    });

    let updated = 0;

    for (const forecast of forecasts) {
      // Get actual sales for that day
      const actualSale = await prisma.salesHistory.findUnique({
        where: {
          productId_date: {
            productId: forecast.productId,
            date: yesterday,
          },
        },
      });

      // Update forecast with actual quantity
      await prisma.demandForecast.update({
        where: { id: forecast.id },
        data: {
          actualQty: actualSale?.quantity || 0,
        },
      });

      updated++;
    }

    console.log(`[FORECAST SERVICE] Updated ${updated} forecast accuracy records`);
    return updated;
  } catch (error) {
    console.error('[FORECAST SERVICE] Accuracy update failed:', error);
    throw error;
  }
};
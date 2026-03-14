import { prisma } from '../utils/prisma';

/**
 * Calculate total inventory value
 */
export const getInventoryValue = async () => {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: {
          where: { quantity: { gt: 0 } },
        },
      },
    });

    let totalValue = 0;
    const breakdown = products.map((product) => {
      const totalQty = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      const value = totalQty * product.costPrice;
      totalValue += value;

      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        quantity: totalQty,
        costPrice: product.costPrice,
        totalValue: value,
      };
    });

    // Group by category
    const byCategory = breakdown.reduce((acc: any, item) => {
      const cat = item.category || 'Uncategorized';
      if (!acc[cat]) {
        acc[cat] = { category: cat, totalValue: 0, items: 0 };
      }
      acc[cat].totalValue += item.totalValue;
      acc[cat].items++;
      return acc;
    }, {});

    return {
      totalValue,
      productCount: breakdown.length,
      breakdown: breakdown.sort((a, b) => b.totalValue - a.totalValue),
      byCategory: Object.values(byCategory),
    };
  } catch (error) {
    console.error('Failed to calculate inventory value:', error);
    throw error;
  }
};

/**
 * ABC Analysis - Classify products by sales value
 * A: Top 20% products contributing 80% revenue
 * B: Next 30% products contributing 15% revenue  
 * C: Bottom 50% products contributing 5% revenue
 */
export const getABCAnalysis = async (days: number = 90) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Use STOCK_OUT transactions as proxy for sales
    const txns = await prisma.inventoryTransaction.findMany({
      where: { type: 'STOCK_OUT', createdAt: { gte: startDate } },
      include: { inventory: { include: { product: true } } },
    });

    const sales = txns.map((t) => ({
      productId: t.inventory.productId,
      quantity: Math.abs(t.quantity),
      product: t.inventory.product,
    }));

    // Calculate revenue per product
    const productRevenue = sales.reduce((acc: any, sale) => {
      const productId = sale.productId;
      const revenue = sale.quantity * sale.product.sellingPrice;

      if (!acc[productId]) {
        acc[productId] = {
          productId,
          sku: sale.product.sku,
          name: sale.product.name,
          category: sale.product.category,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }

      acc[productId].totalQuantity += sale.quantity;
      acc[productId].totalRevenue += revenue;
      return acc;
    }, {});

    // Convert to array and sort by revenue
    const products = Object.values(productRevenue).sort(
      (a: any, b: any) => b.totalRevenue - a.totalRevenue
    );

    if (products.length === 0) {
      return { A: [], B: [], C: [], stats: { totalRevenue: 0, productCount: 0 } };
    }

    const totalRevenue = products.reduce((sum: number, p: any) => sum + p.totalRevenue, 0);

    // Calculate cumulative revenue percentages
    let cumulative = 0;
    const classified = products.map((p: any) => {
      cumulative += p.totalRevenue;
      const cumulativePercent = (cumulative / totalRevenue) * 100;
      const revenuePercent = (p.totalRevenue / totalRevenue) * 100;

      return {
        ...p,
        revenuePercent: Math.round(revenuePercent * 100) / 100,
        cumulativePercent: Math.round(cumulativePercent * 100) / 100,
      };
    });

    // Classify into A, B, C
    const A: any[] = [];
    const B: any[] = [];
    const C: any[] = [];

    classified.forEach((item: any) => {
      if (item.cumulativePercent <= 80) {
        A.push({ ...item, class: 'A' });
      } else if (item.cumulativePercent <= 95) {
        B.push({ ...item, class: 'B' });
      } else {
        C.push({ ...item, class: 'C' });
      }
    });

    return {
      A,
      B,
      C,
      stats: {
        totalRevenue,
        productCount: products.length,
        classA: { count: A.length, revenue: A.reduce((s: number, p) => s + p.totalRevenue, 0) },
        classB: { count: B.length, revenue: B.reduce((s: number, p) => s + p.totalRevenue, 0) },
        classC: { count: C.length, revenue: C.reduce((s: number, p) => s + p.totalRevenue, 0) },
      },
    };
  } catch (error) {
    console.error('Failed to perform ABC analysis:', error);
    throw error;
  }
};

/**
 * Calculate stock turnover ratio
 * Turnover = Cost of Goods Sold / Average Inventory Value
 */
export const getStockTurnover = async (days: number = 90) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Use STOCK_OUT transactions as proxy for COGS
    const txns = await prisma.inventoryTransaction.findMany({
      where: { type: 'STOCK_OUT', createdAt: { gte: startDate } },
      include: { inventory: { include: { product: true } } },
    });

    const cogs = txns.reduce((sum, t) => {
      return sum + Math.abs(t.quantity) * t.inventory.product.costPrice;
    }, 0);

    // Get current inventory value
    const { totalValue: currentValue } = await getInventoryValue();

    // Estimate average inventory (simplified: current value)
    const avgInventoryValue = currentValue;

    // Calculate turnover ratio
    const turnoverRatio = avgInventoryValue > 0 ? cogs / avgInventoryValue : 0;

    // Days inventory outstanding (DIO)
    const daysInventory = turnoverRatio > 0 ? days / turnoverRatio : 0;

    return {
      period: days,
      costOfGoodsSold: cogs,
      averageInventoryValue: avgInventoryValue,
      turnoverRatio: Math.round(turnoverRatio * 100) / 100,
      daysInventory: Math.round(daysInventory),
    };
  } catch (error) {
    console.error('Failed to calculate stock turnover:', error);
    throw error;
  }
};

/**
 * Get forecast accuracy metrics
 */
export const getForecastAccuracy = async (days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const forecasts = await prisma.demandForecast.findMany({
      where: {
        forecastDate: { gte: startDate },
        actualQty: { not: null },
      },
      include: {
        product: { select: { name: true, sku: true } },
      },
    });

    if (forecasts.length === 0) {
      return {
        totalForecasts: 0,
        mae: 0,
        mape: 0,
        accuracy: 0,
        forecasts: [],
      };
    }

    // Calculate Mean Absolute Error (MAE)
    const mae =
      forecasts.reduce((sum, f) => sum + Math.abs(f.predictedQty - (f.actualQty || 0)), 0) /
      forecasts.length;

    // Calculate Mean Absolute Percentage Error (MAPE)
    const mapeSum = forecasts.reduce((sum, f) => {
      if (!f.actualQty) return sum;
      return sum + Math.abs((f.predictedQty - f.actualQty) / f.actualQty) * 100;
    }, 0);
    const mape = forecasts.filter((f) => f.actualQty).length > 0
      ? mapeSum / forecasts.filter((f) => f.actualQty).length
      : 0;

    // Overall accuracy (100 - MAPE)
    const accuracy = Math.max(0, 100 - mape);

    return {
      totalForecasts: forecasts.length,
      mae: Math.round(mae * 10) / 10,
      mape: Math.round(mape * 10) / 10,
      accuracy: Math.round(accuracy * 10) / 10,
      forecasts: forecasts.slice(0, 20), // Recent 20
    };
  } catch (error) {
    console.error('Failed to calculate forecast accuracy:', error);
    throw error;
  }
};

/**
 * Get sales trends over time
 */
export const getSalesTrends = async (days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Use STOCK_OUT transactions as proxy for sales
    const txns = await prisma.inventoryTransaction.findMany({
      where: { type: 'STOCK_OUT', createdAt: { gte: startDate } },
      include: { inventory: { include: { product: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailySales = txns.reduce((acc: any, t) => {
      const dateKey = t.createdAt.toISOString().split('T')[0];
      const qty = Math.abs(t.quantity);

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, totalQuantity: 0, totalRevenue: 0, orderCount: 0 };
      }

      acc[dateKey].totalQuantity += qty;
      acc[dateKey].totalRevenue += qty * t.inventory.product.sellingPrice;
      acc[dateKey].orderCount++;

      return acc;
    }, {});

    const trends = Object.values(dailySales).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    );

    return trends;
  } catch (error) {
    console.error('Failed to get sales trends:', error);
    throw error;
  }
};

/**
 * Get top selling products
 */
export const getTopSellingProducts = async (days: number = 30, limit: number = 10) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Use STOCK_OUT transactions as proxy for sales
    const txns = await prisma.inventoryTransaction.findMany({
      where: { type: 'STOCK_OUT', createdAt: { gte: startDate } },
      include: { inventory: { include: { product: true } } },
    });

    // Aggregate by product
    const productSales = txns.reduce((acc: any, t) => {
      const productId = t.inventory.productId;
      const qty = Math.abs(t.quantity);

      if (!acc[productId]) {
        acc[productId] = {
          productId,
          sku: t.inventory.product.sku,
          name: t.inventory.product.name,
          category: t.inventory.product.category,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }

      acc[productId].totalQuantity += qty;
      acc[productId].totalRevenue += qty * t.inventory.product.sellingPrice;

      return acc;
    }, {});

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return topProducts;
  } catch (error) {
    console.error('Failed to get top selling products:', error);
    throw error;
  }
};

/**
 * Get dashboard summary
 */
export const getDashboardSummary = async () => {
  try {
    const [
      inventoryValue,
      turnover,
      topProducts,
      lowStockCount,
      totalSales,
      forecastAccuracy,
    ] = await Promise.all([
      getInventoryValue(),
      getStockTurnover(30),
      getTopSellingProducts(30, 5),
      prisma.product.findMany({
        select: { id: true, reorderPoint: true, inventory: { select: { quantity: true } } },
      }).then((products) =>
        products.filter((p) => {
          const total = p.inventory.reduce((s, i) => s + i.quantity, 0);
          return total < p.reorderPoint;
        }).length
      ),
      prisma.inventoryTransaction.aggregate({
        where: {
          type: 'STOCK_OUT',
          createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
        },
        _sum: { quantity: true },
      }),
      getForecastAccuracy(30),
    ]);

    return {
      inventoryValue: inventoryValue.totalValue,
      productCount: inventoryValue.productCount,
      turnoverRatio: turnover.turnoverRatio,
      lowStockCount,
      totalSalesUnits: totalSales._sum.quantity || 0,
      forecastAccuracy: forecastAccuracy.accuracy,
      topProducts,
    };
  } catch (error) {
    console.error('Failed to get dashboard summary:', error);
    throw error;
  }
};
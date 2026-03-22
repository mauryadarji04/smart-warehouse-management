'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Package, AlertCircle, TrendingDown, Warehouse, RefreshCw, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { StockProgressBar } from '@/components/ui/StockProgressBar';
import { GaugeChart } from '@/components/ui/GaugeChart';
import { WarehouseHeatMap, WarehouseZone } from '@/components/ui/WarehouseHeatMap';
import { FAB } from '@/components/ui/FAB';

// Generate simple sparkline history from current value with slight variation
function generateSparkData(current: number, points = 8): { v: number }[] {
  const data: { v: number }[] = [];
  for (let i = 0; i < points - 1; i++) {
    const variation = (Math.random() - 0.5) * 0.3;
    data.push({ v: Math.max(0, Math.round(current * (0.75 + variation))) });
  }
  data.push({ v: current });
  return data;
}

// Mock warehouse zone data – in production, fetch from API
const WAREHOUSE_ZONES: WarehouseZone[] = [
  { id: 'A1', label: 'Zone A1', occupancy: 92 },
  { id: 'A2', label: 'Zone A2', occupancy: 78 },
  { id: 'B1', label: 'Zone B1', occupancy: 55 },
  { id: 'B2', label: 'Zone B2', occupancy: 43 },
  { id: 'C1', label: 'Zone C1', occupancy: 28 },
  { id: 'C2', label: 'Zone C2', occupancy: 65 },
  { id: 'D1', label: 'Zone D1', occupancy: 12 },
  { id: 'D2', label: 'Zone D2', occupancy: 88 },
];

// Mock stock data – replace with API data
const STOCK_LEVELS = [
  { label: 'Electronics', current: 420, capacity: 500 },
  { label: 'Apparel', current: 310, capacity: 600 },
  { label: 'Food & Bev', current: 190, capacity: 250 },
  { label: 'Furniture', current: 85, capacity: 200 },
  { label: 'Automotive', current: 50, capacity: 150 },
];

interface Stats {
  totalProducts: number;
  lowStock: number;
  totalInventory: number;
  unreadAlerts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    lowStock: 0,
    totalInventory: 0,
    unreadAlerts: 0,
  });
  const [prevStats, setPrevStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sparkDataRef = useRef<Record<string, { v: number }[]>>({});

  const fetchStats = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [products, lowStock, alerts] = await Promise.all([
        api.get('/products'),
        api.get('/inventory/low-stock'),
        api.get('/alerts/stats'),
      ]);

      const totalInventory = products.data.data.reduce(
        (sum: number, p: any) => sum + (p.totalQuantity || 0),
        0
      );

      const newStats: Stats = {
        totalProducts: products.data.data.length,
        lowStock: lowStock.data.data.length,
        totalInventory,
        unreadAlerts: alerts.data.data.unread,
      };

      setPrevStats((prev) => prev ?? newStats);
      setStats((prev) => {
        setPrevStats(prev);
        return newStats;
      });

      // Regenerate sparklines on every fetch
      sparkDataRef.current = {
        totalProducts: generateSparkData(newStats.totalProducts),
        lowStock: generateSparkData(newStats.lowStock),
        totalInventory: generateSparkData(newStats.totalInventory),
        unreadAlerts: generateSparkData(newStats.unreadAlerts),
      };

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchStats();
    const interval = setInterval(() => fetchStats(), 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  function getTrend(key: keyof Stats, goodWhenLow = false): 'up' | 'down' | 'neutral' {
    if (!prevStats) return 'neutral';
    const diff = stats[key] - prevStats[key];
    if (diff === 0) return 'neutral';
    const isPositive = goodWhenLow ? diff < 0 : diff > 0;
    return isPositive ? 'up' : 'down';
  }

  function getTrendValue(key: keyof Stats): string | undefined {
    if (!prevStats) return undefined;
    const diff = stats[key] - (prevStats[key] || 1);
    if (diff === 0) return undefined;
    return `${diff > 0 ? '+' : ''}${diff}`;
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'blue' as const,
      trend: getTrend('totalProducts'),
      trendValue: getTrendValue('totalProducts'),
      sparkData: sparkDataRef.current.totalProducts ?? [],
      subtitle: 'SKUs in catalog',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStock,
      icon: TrendingDown,
      color: (stats.lowStock > 0 ? 'red' : 'green') as 'red' | 'green',
      trend: getTrend('lowStock', true),
      trendValue: getTrendValue('lowStock'),
      sparkData: sparkDataRef.current.lowStock ?? [],
      subtitle: 'Need reorder',
    },
    {
      title: 'Total Inventory',
      value: stats.totalInventory.toLocaleString(),
      icon: Warehouse,
      color: 'green' as const,
      trend: getTrend('totalInventory'),
      trendValue: getTrendValue('totalInventory'),
      sparkData: sparkDataRef.current.totalInventory ?? [],
      subtitle: 'Units in stock',
    },
    {
      title: 'Unread Alerts',
      value: stats.unreadAlerts,
      icon: AlertCircle,
      color: (stats.unreadAlerts > 0 ? 'yellow' : 'gray') as 'yellow' | 'gray',
      trend: getTrend('unreadAlerts', true),
      trendValue: getTrendValue('unreadAlerts'),
      sparkData: sparkDataRef.current.unreadAlerts ?? [],
      subtitle: 'Require attention',
    },
  ];

  const forecastAccuracy = 76; // Would come from API in production

  return (
    <div className="space-y-8 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--foreground)' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1 flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            Live — refreshes every 30s
            {mounted && lastRefreshed && (
              <>
                <span className="text-slate-400 dark:text-slate-600">·</span>
                <span suppressHydrationWarning>
                  Last updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all border"
          style={{
            backgroundColor: 'var(--surface)',
            color: 'var(--foreground)',
            borderColor: 'var(--border)',
          }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => (
              <StatCard key={card.title} {...card} loading={false} />
            ))
        }
      </div>

      {/* Middle row: Stock Levels + Forecast Accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Progress Bars */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
                Stock Levels by Category
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                Capacity utilization across product categories
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {STOCK_LEVELS.map((item) => (
              <StockProgressBar
                key={item.label}
                label={item.label}
                current={item.current}
                capacity={item.capacity}
              />
            ))}
          </div>
        </div>

        {/* Gauge Chart */}
        <div className="card flex flex-col items-center justify-center">
          <div className="mb-3 text-center">
            <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Forecast Accuracy
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              AI prediction accuracy rate
            </p>
          </div>
          <GaugeChart value={forecastAccuracy} label="Forecast Accuracy" size={200} />
        </div>
      </div>

      {/* Warehouse Heat Map */}
      <div className="card">
        <div className="mb-5">
          <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
            Warehouse Zone Occupancy
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Real-time heat map — hover a zone for details
          </p>
        </div>
        <WarehouseHeatMap zones={WAREHOUSE_ZONES} />
      </div>

      {/* Quick Stats */}
      <div className="card">
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Quick Stats
        </h2>
        <div className="space-y-0">
          {[
            {
              label: 'Stock Coverage',
              status: stats.lowStock === 0 ? 'Healthy' : `${stats.lowStock} items low`,
              ok: stats.lowStock === 0,
            },
            {
              label: 'Alert Status',
              status: stats.unreadAlerts === 0 ? 'All clear' : `${stats.unreadAlerts} unread`,
              ok: stats.unreadAlerts === 0,
            },
            {
              label: 'Forecast Accuracy',
              status: `${forecastAccuracy}% — ${forecastAccuracy >= 80 ? 'Excellent' : forecastAccuracy >= 60 ? 'Fair' : 'Needs attention'}`,
              ok: forecastAccuracy >= 70,
            },
          ].map((row, i, arr) => (
            <div
              key={row.label}
              className={`flex justify-between items-center py-3 ${i < arr.length - 1 ? 'border-b' : ''}`}
              style={{ borderColor: 'var(--border)' }}
            >
              <span className="text-sm" style={{ color: 'var(--muted)' }}>
                {row.label}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${row.ok
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <FAB />
    </div>
  );
}

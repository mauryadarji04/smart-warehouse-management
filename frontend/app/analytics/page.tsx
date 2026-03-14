'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Package, Activity, Target, Award } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [dashboard, setDashboard] = useState<any>(null);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [abcAnalysis, setAbcAnalysis] = useState<any>(null);
  const [inventoryValue, setInventoryValue] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [dashRes, trendsRes, abcRes, valueRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get(`/analytics/sales-trends?days=${period}`),
        api.get(`/analytics/abc-analysis?days=${period}`),
        api.get('/analytics/inventory-value'),
      ]);

      setDashboard(dashRes.data.data);
      setSalesTrends(trendsRes.data.data);
      setAbcAnalysis(abcRes.data.data);
      setInventoryValue(valueRes.data.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return <div className="text-center py-20">Loading analytics...</div>;
  }

  const abcData = abcAnalysis
    ? [
        { name: 'Class A', value: abcAnalysis.stats.classA.count, revenue: abcAnalysis.stats.classA.revenue },
        { name: 'Class B', value: abcAnalysis.stats.classB.count, revenue: abcAnalysis.stats.classB.revenue },
        { name: 'Class C', value: abcAnalysis.stats.classC.count, revenue: abcAnalysis.stats.classC.revenue },
      ]
    : [];

  const categoryData = inventoryValue?.byCategory || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Analytics Dashboard</h1>
          <p className="text-slate-500 mt-1">Insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              size="sm"
              variant={period === days ? 'primary' : 'secondary'}
              onClick={() => setPeriod(days)}
            >
              {days} Days
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Inventory Value</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                ${dashboard?.inventoryValue?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Products</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{dashboard?.productCount || 0}</p>
            </div>
            <div className="p-2 rounded-lg bg-green-100">
              <Package className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Turnover Ratio</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {dashboard?.turnoverRatio?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-yellow-100">
              <Activity className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Low Stock Items</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{dashboard?.lowStockCount || 0}</p>
            </div>
            <div className="p-2 rounded-lg bg-red-100">
              <Package className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Sales (Units)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{dashboard?.totalSalesUnits || 0}</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-100">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Forecast Accuracy</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {dashboard?.forecastAccuracy?.toFixed(0) || 0}%
              </p>
            </div>
            <div className="p-2 rounded-lg bg-indigo-100">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends */}
        <Card>
          <h2 className="text-lg font-bold mb-4">Sales Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalQuantity" stroke="#3b82f6" name="Units Sold" />
              <Line type="monotone" dataKey="totalRevenue" stroke="#10b981" name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* ABC Analysis */}
        <Card>
          <h2 className="text-lg font-bold mb-4">ABC Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={abcData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {abcData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }}></div>
                Class A (High Value)
              </span>
              <span className="font-semibold">
                ${abcAnalysis?.stats?.classA?.revenue?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }}></div>
                Class B (Medium Value)
              </span>
              <span className="font-semibold">
                ${abcAnalysis?.stats?.classB?.revenue?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[2] }}></div>
                Class C (Low Value)
              </span>
              <span className="font-semibold">
                ${abcAnalysis?.stats?.classC?.revenue?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Value by Category */}
        <Card>
          <h2 className="text-lg font-bold mb-4">Inventory Value by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalValue" fill="#8b5cf6" name="Value ($)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <h2 className="text-lg font-bold mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {dashboard?.topProducts?.slice(0, 5).map((product: any, index: number) => (
              <div key={product.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">${product.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{product.totalQuantity} units</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Info Panel */}
      <Card className="bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📊 Analytics Metrics Explained</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            <strong>Inventory Value:</strong> Total cost of all products currently in stock
          </li>
          <li>
            <strong>Turnover Ratio:</strong> How many times inventory is sold and replaced (higher = better)
          </li>
          <li>
            <strong>ABC Analysis:</strong> Class A = Top 20% products (80% revenue), B = Next 30%, C = Bottom 50%
          </li>
          <li>
            <strong>Forecast Accuracy:</strong> How closely predictions match actual sales (100% = perfect)
          </li>
        </ul>
      </Card>
    </div>
  );
}
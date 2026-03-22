'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { DateRangePicker, DateRange } from '@/components/ui/DateRangePicker';
import { ReportBuilder } from '@/components/ui/ReportBuilder';
import { WidgetGrid, Widget } from '@/components/analytics/WidgetGrid';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, DollarSign, Package, Activity, Target,
  Download, GitCompare, ArrowLeft,
} from 'lucide-react';
import { subDays, startOfMonth, subMonths, endOfMonth, format } from 'date-fns';
import { clsx } from 'clsx';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'sales-trends', title: 'Sales Trends', size: 'half', visible: true },
  { id: 'abc-analysis', title: 'ABC Analysis', size: 'half', visible: true },
  { id: 'category-value', title: 'Inventory Value by Category', size: 'half', visible: true },
  { id: 'top-products', title: 'Top Selling Products', size: 'half', visible: true },
];

const LAYOUT_KEY = 'analytics-widget-layout';

function loadLayout(): Widget[] {
  if (typeof window === 'undefined') return DEFAULT_WIDGETS;
  try {
    const saved = localStorage.getItem(LAYOUT_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

// Drill-down panel for pie slice click
function DrillDownPanel({ data, onClose }: { data: any; onClose: () => void }) {
  if (!data) return null;
  const products: any[] = data.products || [];
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            </button>
            <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
              {data.name} — Product Details
            </h2>
          </div>
          <span className="text-sm font-semibold text-blue-600">${data.revenue?.toLocaleString()}</span>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>No product data available</p>
        ) : (
          <div className="space-y-2">
            {products.map((p: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--surface-hover)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{p.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>${p.revenue?.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.quantity} units</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [abcAnalysis, setAbcAnalysis] = useState<any>(null);
  const [inventoryValue, setInventoryValue] = useState<any>(null);

  // Comparison mode
  const [compareMode, setCompareMode] = useState(false);
  const [prevSalesTrends, setPrevSalesTrends] = useState<any[]>([]);

  // Date range
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 29),
    to: new Date(),
    label: 'Last 30 Days',
  });

  // Drill-down
  const [drillDown, setDrillDown] = useState<any>(null);

  // Widget layout
  const [widgets, setWidgets] = useState<Widget[]>(loadLayout);

  // Export ref
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleLayoutChange = (updated: Widget[]) => {
    setWidgets(updated);
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(updated));
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000) + 1;
      const [dashRes, trendsRes, abcRes, valueRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get(`/analytics/sales-trends?days=${days}`),
        api.get(`/analytics/abc-analysis?days=${days}`),
        api.get('/analytics/inventory-value'),
      ]);
      setDashboard(dashRes.data.data);
      setSalesTrends(trendsRes.data.data);
      setAbcAnalysis(abcRes.data.data);
      setInventoryValue(valueRes.data.data);

      if (compareMode) {
        const prevDays = days * 2;
        const prevRes = await api.get(`/analytics/sales-trends?days=${prevDays}`);
        const all: any[] = prevRes.data.data;
        setPrevSalesTrends(all.slice(0, all.length - days));
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, compareMode]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleExport = async () => {
    if (!dashboardRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    const canvas = await html2canvas(dashboardRef.current, { scale: 1.5, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const abcData = abcAnalysis
    ? [
        { name: 'Class A', value: abcAnalysis.stats.classA.count, revenue: abcAnalysis.stats.classA.revenue, products: abcAnalysis.classA },
        { name: 'Class B', value: abcAnalysis.stats.classB.count, revenue: abcAnalysis.stats.classB.revenue, products: abcAnalysis.classB },
        { name: 'Class C', value: abcAnalysis.stats.classC.count, revenue: abcAnalysis.stats.classC.revenue, products: abcAnalysis.classC },
      ]
    : [];

  const categoryData = inventoryValue?.byCategory || [];

  const kpis = [
    { label: 'Inventory Value', value: `$${dashboard?.inventoryValue?.toLocaleString() || 0}`, icon: DollarSign, color: 'blue' },
    { label: 'Total Products', value: dashboard?.productCount || 0, icon: Package, color: 'green' },
    { label: 'Turnover Ratio', value: dashboard?.turnoverRatio?.toFixed(2) || '0.00', icon: Activity, color: 'yellow' },
    { label: 'Low Stock Items', value: dashboard?.lowStockCount || 0, icon: Package, color: 'red' },
    { label: 'Sales (Units)', value: dashboard?.totalSalesUnits || 0, icon: TrendingUp, color: 'purple' },
    { label: 'Forecast Accuracy', value: `${dashboard?.forecastAccuracy?.toFixed(0) || 0}%`, icon: Target, color: 'indigo' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'sales-trends':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={salesTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="totalQuantity" stroke="#3b82f6" name="Units Sold" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="totalRevenue" stroke="#10b981" name="Revenue ($)" dot={false} strokeWidth={2} />
              {compareMode && prevSalesTrends.length > 0 && (
                <Line type="monotone" data={prevSalesTrends} dataKey="totalRevenue" stroke="#f59e0b" name="Prev Revenue" dot={false} strokeWidth={2} strokeDasharray="4 4" />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'abc-analysis': {
        const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }: any) => {
          const RADIAN = Math.PI / 180;
          const radius = innerRadius + (outerRadius - innerRadius) * 0.5 + 16;
          const x = cx + radius * Math.cos(-midAngle * RADIAN);
          const y = cy + radius * Math.sin(-midAngle * RADIAN);
          return (
            <text x={x} y={y} fill="var(--foreground)" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={500}>
              {`${name}: ${value}`}
            </text>
          );
        };
        return (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={abcData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={80}
                  dataKey="value"
                  onClick={(data) => setDrillDown(data)}
                  style={{ cursor: 'pointer' }}
                >
                  {abcData.map((_e, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--muted)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-center mt-1" style={{ color: 'var(--muted)' }}>Click a slice to drill down</p>
            <div className="mt-3 space-y-1.5">
              {abcData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    {d.name}
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>${d.revenue?.toLocaleString() || 0}</span>
                </div>
              ))}
            </div>
          </>
        );
      }

      case 'category-value':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="totalValue" fill="#8b5cf6" name="Value ($)" radius={[4, 4, 0, 0]} />
              {compareMode && (
                <Bar dataKey="prevValue" fill="#f59e0b" name="Prev Value ($)" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'top-products':
        return (
          <div className="space-y-3">
            {dashboard?.topProducts?.slice(0, 5).map((p: any, i: number) => (
              <div key={p.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{p.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>${p.totalRevenue?.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.totalQuantity} units</p>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={dashboardRef}>
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Analytics Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Insights and performance metrics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
              compareMode ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            )}
            style={!compareMode ? { backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' } : {}}
          >
            <GitCompare className="w-4 h-4" />
            {compareMode ? 'Comparing' : 'Compare'}
          </button>
          <ReportBuilder onGenerate={(cfg) => console.log('Report config:', cfg)} />
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {compareMode && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm animate-fade-in"
          style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--primary)', color: 'var(--primary)' }}
        >
          <GitCompare className="w-4 h-4" />
          Comparison mode active — dashed lines show previous period data
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-4 border"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: 'var(--foreground)' }}>{value}</p>
              </div>
              <div className={clsx('p-2 rounded-lg', colorMap[color])}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Widget Grid */}
      <WidgetGrid
        widgets={widgets}
        onLayoutChange={handleLayoutChange}
        renderWidget={renderWidget}
      />

      {/* Drill-down modal */}
      {drillDown && <DrillDownPanel data={drillDown} onClose={() => setDrillDown(null)} />}
    </div>
  );
}

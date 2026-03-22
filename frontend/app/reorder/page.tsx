'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { RefreshCw, Play, TrendingUp, DollarSign, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ReorderPage() {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [runningCheck, setRunningCheck] = useState(false);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reorder/preview');
      setPreview(res.data.data);
    } catch (err) {
      console.error('Failed to fetch reorder preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const runReorderCheck = async () => {
    if (!confirm('Run auto-reorder check now? This will create purchase orders for low-stock items.')) return;
    setRunningCheck(true);
    try {
      const res = await api.post('/reorder/check');
      alert(`✅ ${res.data.message}\n\nCheck the Purchase Orders page to see new orders.`);
      fetchPreview();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to run reorder check');
    } finally {
      setRunningCheck(false);
    }
  };

  useEffect(() => { fetchPreview(); }, []);

  const totalCost = preview?.preview?.reduce((sum: number, item: any) => sum + item.estimatedCost, 0) ?? 0;

  if (loading && !preview) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => <div key={i} className="h-28 rounded-xl animate-shimmer" />)}
        </div>
        <div className="h-96 rounded-xl animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Auto-Reorder System
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            EOQ-based intelligent inventory replenishment
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPreview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface)' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={runReorderCheck}
            disabled={runningCheck}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
          >
            <Play className="w-4 h-4" />
            {runningCheck ? 'Running...' : 'Run Reorder Check'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Needs Reorder</p>
              <p className="text-3xl font-bold mt-2" style={{ color: '#F59E0B' }}>
                {preview?.productsNeedingReorder ?? 0}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>products below reorder point</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Estimated Cost</p>
              <p className="text-3xl font-bold mt-2" style={{ color: '#10B981' }}>
                ${totalCost.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>to replenish all items</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Optimization</p>
              <p className="text-xl font-bold mt-2" style={{ color: '#3B82F6' }}>EOQ Algorithm</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Economic Order Quantity</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Reorder Table */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>
            Products Below Reorder Point
          </h2>
          {preview?.preview?.length > 0 && (
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
            >
              {preview.preview.length} items
            </span>
          )}
        </div>

        {preview?.preview?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ECFDF5' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: '#10B981' }} />
            </div>
            <p className="font-semibold" style={{ color: 'var(--foreground)' }}>All stock levels are healthy!</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No reorders needed at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Product', 'Supplier', 'Current Stock', 'Reorder Point', 'EOQ Qty', 'Est. Cost', 'Status'].map(h => (
                    <th
                      key={h}
                      className="pb-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview?.preview?.map((item: any) => {
                  const isOut = item.currentStock === 0;
                  return (
                    <tr
                      key={item.product.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      {/* Product */}
                      <td className="py-4 pr-4">
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          {item.product.name}
                        </p>
                        <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--muted)' }}>
                          {item.product.sku}
                        </p>
                      </td>

                      {/* Supplier */}
                      <td className="py-4 pr-4">
                        <span className="text-sm" style={{ color: 'var(--foreground)' }}>{item.supplier}</span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-4 pr-4">
                        <span
                          className="text-sm font-bold px-2.5 py-1 rounded-lg"
                          style={{
                            backgroundColor: isOut ? '#FEF2F2' : '#FFFBEB',
                            color: isOut ? '#EF4444' : '#F59E0B',
                          }}
                        >
                          {item.currentStock}
                        </span>
                      </td>

                      {/* Reorder Point */}
                      <td className="py-4 pr-4">
                        <span className="text-sm" style={{ color: 'var(--muted)' }}>{item.reorderPoint}</span>
                      </td>

                      {/* EOQ Qty */}
                      <td className="py-4 pr-4">
                        <p className="text-sm font-bold" style={{ color: '#3B82F6' }}>
                          {item.recommendedOrderQty}
                        </p>
                        {item.eoqCalculated > 0 && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            EOQ: {item.eoqCalculated}
                          </p>
                        )}
                      </td>

                      {/* Est. Cost */}
                      <td className="py-4 pr-4">
                        <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          ${item.estimatedCost.toFixed(2)}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={
                            isOut
                              ? { backgroundColor: '#FEF2F2', color: '#EF4444' }
                              : { backgroundColor: '#FFFBEB', color: '#92400E' }
                          }
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {item.reason.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Info Panel */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--primary-light)', border: '1px solid #BFDBFE' }}
      >
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <TrendingUp className="w-4 h-4" style={{ color: '#3B82F6' }} />
          How Auto-Reorder Works
        </h3>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--foreground)' }}>
          {[
            ['EOQ Calculation', 'EOQ = √((2 × Annual Demand × Ordering Cost) / Holding Cost)'],
            ['Reorder Point', 'Triggered when stock falls below: Daily Demand × Lead Time'],
            ['Cron Schedule', 'Runs automatically every day at 6:00 AM'],
            ['Smart Logic', 'Skips products without suppliers, prevents duplicate orders'],
          ].map(([title, desc]) => (
            <li key={title} className="flex gap-2">
              <span className="font-semibold shrink-0" style={{ color: '#3B82F6' }}>{title}:</span>
              <span style={{ color: 'var(--muted)' }}>{desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

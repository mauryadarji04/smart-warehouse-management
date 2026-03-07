'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { RefreshCw, Play, TrendingUp, DollarSign, Package } from 'lucide-react';

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
      fetchPreview(); // Refresh preview
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to run reorder check');
    } finally {
      setRunningCheck(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, []);

  if (loading && !preview) {
    return <div className="text-center py-20">Loading reorder preview...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Auto-Reorder System</h1>
          <p className="text-slate-500 mt-1">EOQ-based intelligent inventory replenishment</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={fetchPreview} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Preview
          </Button>
          <Button onClick={runReorderCheck} disabled={runningCheck}>
            <Play className="w-4 h-4" />
            {runningCheck ? 'Running...' : 'Run Reorder Check'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Products Needing Reorder</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {preview?.productsNeedingReorder || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Estimated Total Cost</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                ${preview?.preview?.reduce((sum: number, item: any) => sum + item.estimatedCost, 0).toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Optimization Method</p>
              <p className="text-xl font-bold text-slate-800 mt-2">EOQ Algorithm</p>
              <p className="text-xs text-slate-500 mt-1">Economic Order Quantity</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Reorder Preview Table */}
      <Card>
        <h2 className="text-xl font-bold mb-4">Products Below Reorder Point</h2>

        {preview?.preview?.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-slate-600 font-medium">All products have healthy stock levels!</p>
            <p className="text-sm text-slate-500 mt-2">No reorders needed at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr className="text-left">
                  <th className="pb-3 font-semibold text-slate-700">Product</th>
                  <th className="pb-3 font-semibold text-slate-700">Supplier</th>
                  <th className="pb-3 font-semibold text-slate-700">Current Stock</th>
                  <th className="pb-3 font-semibold text-slate-700">Reorder Point</th>
                  <th className="pb-3 font-semibold text-slate-700">EOQ Qty</th>
                  <th className="pb-3 font-semibold text-slate-700">Est. Cost</th>
                  <th className="pb-3 font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview?.preview?.map((item: any) => (
                  <tr key={item.product.id} className="hover:bg-slate-50">
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-slate-800">{item.product.name}</p>
                        <p className="text-xs text-slate-500">{item.product.sku}</p>
                      </div>
                    </td>
                    <td className="py-4 text-slate-600">{item.supplier}</td>
                    <td className="py-4">
                      <span className={item.currentStock === 0 ? 'text-red-600 font-bold' : 'text-yellow-600 font-semibold'}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600">{item.reorderPoint}</td>
                    <td className="py-4">
                      <div>
                        <p className="font-semibold text-blue-600">{item.recommendedOrderQty}</p>
                        {item.eoqCalculated > 0 && (
                          <p className="text-xs text-slate-500">EOQ: {item.eoqCalculated}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 font-medium text-slate-800">${item.estimatedCost.toFixed(2)}</td>
                    <td className="py-4">
                      <Badge variant={item.reason === 'OUT_OF_STOCK' ? 'red' : 'yellow'}>
                        {item.reason.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Info Panel */}
      <Card className="bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📊 How Auto-Reorder Works</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>EOQ Calculation:</strong> EOQ = √((2 × Annual Demand × Ordering Cost) / Holding Cost)
          </li>
          <li>
            <strong>Reorder Point:</strong> Triggered when stock falls below: Daily Demand × Lead Time
          </li>
          <li>
            <strong>Cron Schedule:</strong> Runs automatically every day at 6:00 AM
          </li>
          <li>
            <strong>Smart Logic:</strong> Skips products without suppliers, prevents duplicate orders
          </li>
        </ul>
      </Card>
    </div>
  );
}
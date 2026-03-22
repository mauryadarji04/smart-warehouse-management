'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PackagePlus, PackageMinus, ScanLine, Package,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BarcodeScanner } from '@/components/ui/BarcodeScanner';
import { StockStepper } from '@/components/ui/StockStepper';
import { StockOutModal } from '@/components/ui/StockOutModal';
import { StockMovementHistory } from '@/components/ui/StockMovementHistory';
import { api } from '@/lib/api';
import { Product, Inventory } from '@/lib/types';
import { StockInData } from '@/components/ui/StockStepper';
import { cn } from '@/lib/utils';

type ProductWithQty = Product & { totalQuantity?: number };

const AVATAR_GRADIENTS = [
  ['#3B82F6', '#2563EB'],
  ['#8B5CF6', '#7C3AED'],
  ['#10B981', '#0D9488'],
  ['#F59E0B', '#EA580C'],
  ['#F43F5E', '#EC4899'],
  ['#06B6D4', '#3B82F6'],
];
function avatarStyle(name: string) {
  const [from, to] = AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
  return { background: `linear-gradient(135deg, ${from}, ${to})` };
}

// ── Toast notification ────────────────────────────────────────────────────────
type ToastType = 'success' | 'error';
function Toast({ msg, type }: { msg: string; type: ToastType }) {
  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-medium animate-bounce-in max-w-xs',
        type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
      )}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 shrink-0" />
      )}
      {msg}
    </div>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({
  label, value, sub, icon: Icon, color,
}: { label: string; value: number | string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div
      className="rounded-xl border p-4 flex items-center gap-4 transition-all hover:shadow-md"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
        <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
        {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductWithQty[]>([]);
  const [batches, setBatches] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  // Modals
  const [showScanner, setShowScanner] = useState(false);
  const [showStepper, setShowStepper] = useState(false);
  const [showStockOut, setShowStockOut] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithQty | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  const showToast = (msg: string, type: ToastType = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const [prodRes, batchRes] = await Promise.all([
        api.get('/products'),
        api.get('/inventory'),
      ]);
      setProducts(prodRes.data.data ?? []);
      setBatches(batchRes.data.data ?? []);
    } catch {
      console.error('Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Summary stats ───────────────────────────────────────────────────────────
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => (p.totalQuantity ?? 0) < p.reorderPoint).length;
  const outOfStock = products.filter((p) => (p.totalQuantity ?? 0) === 0).length;
  const healthyCount = totalProducts - lowStockCount - outOfStock;

  // ── Barcode scan handler ────────────────────────────────────────────────────
  const handleScan = (code: string) => {
    setShowScanner(false);
    const match = products.find(
      (p) => p.sku.toLowerCase() === code.toLowerCase() || p.id === code
    );
    if (match) {
      setSelectedProduct(match);
      setShowStepper(true);
    } else {
      showToast(`No product found for barcode: ${code}`, 'error');
    }
  };

  // ── Stock In handler ────────────────────────────────────────────────────────
  const openStockIn = (product: ProductWithQty) => {
    setSelectedProduct(product);
    setShowStepper(true);
  };
  const handleStockIn = async (data: StockInData) => {
    await api.post('/inventory/stock-in', {
      ...data,
      quantity: Number(data.quantity),
    });
    showToast(`✅ ${data.quantity} units added to ${selectedProduct?.name}`);
    await fetchProducts();
    setHistoryKey((k) => k + 1);
  };

  // ── Stock Out handler ───────────────────────────────────────────────────────
  const openStockOut = (product: ProductWithQty) => {
    setSelectedProduct(product);
    setShowStockOut(true);
  };
  const handleStockOut = async (data: { productId: string; quantity: number; reason: string }) => {
    await api.post('/inventory/stock-out', data);
    showToast(`📤 ${data.quantity} units removed from ${selectedProduct?.name}`);
    setShowStockOut(false);
    await fetchProducts();
    setHistoryKey((k) => k + 1);
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl animate-shimmer" />)}
        </div>
        <div className="h-96 rounded-xl animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Inventory Operations
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Stock in/out, batch management, and movement history
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchProducts()}
            className="p-2.5 rounded-xl border transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {/* ── BARCODE SCANNER BUTTON ─────────────────────────────────────── */}
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
          >
            <ScanLine className="w-4 h-4" />
            Scan Barcode
          </button>
        </div>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Products" value={totalProducts} icon={Package} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
        <SummaryCard label="Healthy Stock" value={healthyCount} icon={TrendingUp} color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" sub="Above reorder point" />
        <SummaryCard label="Low Stock" value={lowStockCount} icon={AlertTriangle} color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" sub="Below reorder point" />
        <SummaryCard label="Out of Stock" value={outOfStock} icon={TrendingDown} color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" sub="Needs restocking" />
      </div>

      {/* ── Products Table ───────────────────────────────────────────────────── */}
      <Card className='bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 backdrop-blur-sm border-0'>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>Products</h2>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--muted)' }}>
            {products.length} items
          </span>
        </div>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Product', 'SKU', 'Current Stock', 'Reorder Point', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stock = product.totalQuantity ?? 0;
                const isLow = stock < product.reorderPoint && stock > 0;
                const isOut = stock === 0;
                const isHealthy = !isLow && !isOut;

                return (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    {/* Product */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs"
                          style={avatarStyle(product.name)}
                        >
                          {product.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{product.name}</p>
                          {product.category && (
                            <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 font-medium">
                              {product.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-4 pr-4">
                      <span className="font-mono text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--muted)' }}>
                        {product.sku}
                      </span>
                    </td>

                    {/* Current Stock */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm font-bold',
                          isOut ? 'text-red-500' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        )}>
                          {stock}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>{product.unit}</span>
                      </div>
                      {/* Mini stock bar */}
                      <div className="mt-1.5 w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-hover)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, product.reorderPoint > 0 ? (stock / (product.reorderPoint * 2)) * 100 : 100)}%`,
                            backgroundColor: isOut ? '#EF4444' : isLow ? '#F59E0B' : '#10B981',
                          }}
                        />
                      </div>
                    </td>

                    {/* Reorder Point */}
                    <td className="py-4 pr-4">
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>{product.reorderPoint} {product.unit}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 pr-4">
                      <Badge variant={isOut ? 'red' : isLow ? 'yellow' : 'green'}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-4">
                      <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openStockIn(product)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:shadow-md hover:shadow-emerald-500/20"
                          style={{ backgroundColor: '#10B981' }}
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          Stock In
                        </button>
                        <button
                          onClick={() => openStockOut(product)}
                          disabled={isOut}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-md disabled:opacity-40 border"
                          style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface-hover)' }}
                        >
                          <PackageMinus className="w-3.5 h-3.5" />
                          Stock Out
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Package className="w-10 h-10" style={{ color: 'var(--muted)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>No products found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Stock Movement History ───────────────────────────────────────────── */}
      <StockMovementHistory key={historyKey} />

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Stock In – 4-step wizard */}
      {showStepper && (
        <StockStepper
          products={products}
          batches={batches}
          onSubmit={handleStockIn}
          onClose={() => { setShowStepper(false); setSelectedProduct(null); }}
          preselectedProduct={selectedProduct}
        />
      )}

      {/* Stock Out modal */}
      {showStockOut && selectedProduct && (
        <StockOutModal
          product={selectedProduct}
          batches={batches}
          onSubmit={handleStockOut}
          onClose={() => { setShowStockOut(false); setSelectedProduct(null); }}
        />
      )}
    </div>
  );
}

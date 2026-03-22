'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Product, Supplier } from '@/lib/types';
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Search,
  Package, AlertTriangle, Calculator, FileText, Truck,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import Link from 'next/link';

interface OrderItem {
  productId: string;
  product?: Product & { totalQuantity?: number };
  quantity: number;
  unitCost: number;
}

const STEPS = [
  { id: 1, label: 'Supplier', icon: Truck },
  { id: 2, label: 'Products', icon: Package },
  { id: 3, label: 'Review', icon: FileText },
];

const inputCls =
  'w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/40';

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<(Product & { totalQuantity?: number })[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [sRes, pRes] = await Promise.all([api.get('/suppliers'), api.get('/products')]);
      setSuppliers(sRes.data.data);
      setProducts(pRes.data.data);
    };
    fetchData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const lowStockProducts = products.filter(
    p => (p.totalQuantity ?? 0) < p.reorderPoint && !items.find(i => i.productId === p.id)
  );
  const filteredProducts = products.filter(
    p =>
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())) &&
      !items.find(i => i.productId === p.id)
  );

  const addProduct = (product: Product & { totalQuantity?: number }) => {
    const eoq = Math.ceil(
      Math.sqrt((2 * (product.avgDailyDemand * 365) * product.orderingCost) / product.holdingCost) || product.reorderQty
    );
    setItems(prev => [
      ...prev,
      { productId: product.id, product, quantity: eoq || product.reorderQty, unitCost: product.costPrice },
    ]);
    setSearch('');
    setShowDropdown(false);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.productId !== id));

  const updateItem = (id: string, field: 'quantity' | 'unitCost', value: number) => {
    setItems(prev => prev.map(i => (i.productId === id ? { ...i, [field]: value } : i)));
  };

  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  const handleSubmit = async () => {
    if (!supplierId || items.length === 0) return;
    setLoading(true);
    try {
      await api.post('/purchase-orders', {
        supplierId,
        items: items.map(i => ({
          productId: i.productId,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
        })),
        expectedDelivery: expectedDelivery || null,
        notes: notes || null,
      });
      router.push('/orders');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create order');
      setLoading(false);
    }
  };

  const canNext =
    step === 1 ? !!supplierId : step === 2 ? items.length > 0 : true;

  return (
    <TooltipProvider>
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {/* Progress Steps */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all"
                  style={{
                    backgroundColor: done ? '#10B981' : active ? '#3B82F6' : 'var(--surface-hover)',
                    color: done || active ? 'white' : 'var(--muted)',
                  }}
                >
                  {done ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: active ? '#3B82F6' : done ? '#10B981' : 'var(--muted)' }}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all"
                  style={{ backgroundColor: step > s.id ? '#10B981' : 'var(--border)' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Card */}
      <div
        className="rounded-2xl p-8 animate-fade-in"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* ── STEP 1: Supplier ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                Select Supplier
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Choose who you're ordering from
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {suppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSupplierId(s.id)}
                  className="text-left p-4 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: supplierId === s.id ? '#3B82F6' : 'var(--border)',
                    backgroundColor: supplierId === s.id ? '#EFF6FF' : 'var(--surface)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                        {s.name}
                      </p>
                      {s.email && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                          {s.email}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}
                    >
                      {s.leadTimeDays}d lead
                    </span>
                  </div>
                  {supplierId === s.id && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium" style={{ color: '#3B82F6' }}>
                      <Check className="w-3.5 h-3.5" /> Selected
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Expected Delivery
                </label>
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={e => setExpectedDelivery(e.target.value)}
                  className={inputCls}
                  style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Internal notes..."
                  className={inputCls}
                  style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Products ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                Add Products
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Search or pick from low-stock suggestions
              </p>
            </div>

            {/* Low stock suggestions */}
            {lowStockProducts.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: '#FFFBEB', border: '1px solid #F59E0B33' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  <span className="text-sm font-semibold" style={{ color: '#92400E' }}>
                    Below Reorder Point ({lowStockProducts.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lowStockProducts.slice(0, 6).map(p => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                      style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #F59E0B66' }}
                    >
                      <Plus className="w-3 h-3" />
                      {p.name}
                      <span className="opacity-60">({p.totalQuantity ?? 0}/{p.reorderPoint})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search products by name or SKU..."
                  className={inputCls + ' pl-10'}
                  style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                />
              </div>
              {showDropdown && search && filteredProducts.length > 0 && (
                <div
                  className="absolute z-50 w-full mt-1 rounded-xl shadow-xl overflow-hidden"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  {filteredProducts.slice(0, 6).map(p => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{p.name}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {p.sku} · Stock: {p.totalQuantity ?? 0} {p.unit}
                        </p>
                      </div>
                      <span className="text-xs font-medium" style={{ color: '#3B82F6' }}>
                        ${p.costPrice}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items table */}
            {items.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  <span className="col-span-4">Product</span>
                  <span className="col-span-2 text-center">Stock</span>
                  <span className="col-span-2 text-center">EOQ Qty</span>
                  <span className="col-span-2 text-center">Unit Cost</span>
                  <span className="col-span-1 text-right">Total</span>
                  <span className="col-span-1" />
                </div>
                {items.map(item => {
                  const p = item.product!;
                  const stock = p.totalQuantity ?? 0;
                  const eoq = Math.ceil(
                    Math.sqrt((2 * (p.avgDailyDemand * 365) * p.orderingCost) / p.holdingCost) || p.reorderQty
                  );
                  return (
                    <div
                      key={item.productId}
                      className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--surface-hover)' }}
                    >
                      {/* Product */}
                      <div className="col-span-4">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{p.name}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.sku}</p>
                      </div>

                      {/* Stock indicator */}
                      <div className="col-span-2 text-center">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: stock < p.reorderPoint ? '#FEF2F2' : '#ECFDF5',
                            color: stock < p.reorderPoint ? '#EF4444' : '#10B981',
                          }}
                        >
                          {stock} {p.unit}
                        </span>
                      </div>

                      {/* Qty with EOQ hint */}
                      <div className="col-span-2">
                        <div className="relative">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 rounded-lg text-sm text-center font-semibold outline-none focus:ring-2 focus:ring-blue-500/40"
                            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                          />
                          {eoq > 0 && item.quantity !== eoq && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => updateItem(item.productId, 'quantity', eoq)}
                                  className="absolute -top-2 -right-2 flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                                  style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}
                                >
                                  <Calculator className="w-2.5 h-2.5" />{eoq}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Click to apply EOQ = {eoq} units</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* Unit cost */}
                      <div className="col-span-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted)' }}>$</span>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitCost}
                            onChange={e => updateItem(item.productId, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-full pl-5 pr-2 py-1.5 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-blue-500/40"
                            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                          />
                        </div>
                      </div>

                      {/* Line total */}
                      <div className="col-span-1 text-right">
                        <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                          ${(item.quantity * item.unitCost).toFixed(0)}
                        </span>
                      </div>

                      {/* Remove */}
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-1 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Live total */}
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}
                >
                  <span className="text-sm font-semibold" style={{ color: '#1D4ED8' }}>
                    Order Total ({items.length} items)
                  </span>
                  <span className="text-2xl font-bold" style={{ color: '#1D4ED8' }}>
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div
                className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                <Package className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Search or pick a suggestion above to add products</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Review ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                Review Order
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Confirm details before submitting
              </p>
            </div>

            {/* Supplier summary */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-hover)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Supplier</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold" style={{ color: 'var(--foreground)' }}>{selectedSupplier?.name}</p>
                  {selectedSupplier?.email && (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{selectedSupplier.email}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Lead time</p>
                  <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                    {selectedSupplier?.leadTimeDays} days
                  </p>
                </div>
                {expectedDelivery && (
                  <div className="text-right">
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Expected delivery</p>
                    <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                      {new Date(expectedDelivery).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items summary */}
            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'var(--surface-hover)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#EFF6FF' }}
                    >
                      <Package className="w-4 h-4" style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.product?.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {item.quantity} {item.product?.unit} × ${item.unitCost}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                    ${(item.quantity * item.unitCost).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Delivery progress preview */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-hover)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
                Delivery Pipeline
              </p>
              <div className="flex items-center gap-2">
                {['DRAFT', 'ORDERED', 'IN_TRANSIT', 'RECEIVED'].map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div
                      className="flex-1 text-center py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        backgroundColor: i === 0 ? '#3B82F6' : 'var(--border)',
                        color: i === 0 ? 'white' : 'var(--muted)',
                      }}
                    >
                      {s.replace('_', ' ')}
                    </div>
                    {i < 3 && <ArrowRight className="w-3 h-3 mx-1 shrink-0" style={{ color: 'var(--muted)' }} />}
                  </div>
                ))}
              </div>
            </div>

            {notes && (
              <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--foreground)' }}>Notes:</strong> {notes}
              </div>
            )}

            {/* Grand total */}
            <div
              className="flex items-center justify-between px-5 py-4 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
            >
              <div>
                <p className="text-sm text-white/80">Grand Total</p>
                <p className="text-xs text-white/60">{items.length} products · {items.reduce((s, i) => s + i.quantity, 0)} units</p>
              </div>
              <span className="text-3xl font-bold text-white">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-30"
          style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-40 text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 text-white"
            style={{ background: loading ? '#94A3B8' : 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            {loading ? 'Creating...' : <><Check className="w-4 h-4" /> Create Order</>}
          </button>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}

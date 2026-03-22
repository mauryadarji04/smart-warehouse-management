'use client';

import { useState } from 'react';
import { Product, Inventory } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  X, Search, Package, ClipboardList, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, ArrowRight,
  Layers, MapPin, Calendar, Hash,
} from 'lucide-react';

interface StockStepperProps {
  products: (Product & { totalQuantity?: number })[];
  batches: Inventory[];
  onSubmit: (data: StockInData) => Promise<void>;
  onClose: () => void;
  preselectedProduct?: Product | null;
}

export interface StockInData {
  productId: string;
  quantity: number;
  batchNo: string;
  expiryDate: string;
  location: string;
  reason: string;
}

const STEPS = [
  { label: 'Product', icon: Search },
  { label: 'Batch Info', icon: ClipboardList },
  { label: 'Review', icon: Package },
  { label: 'Done', icon: CheckCircle2 },
];

export function StockStepper({ products, batches, onSubmit, onClose, preselectedProduct }: StockStepperProps) {
  const [step, setStep] = useState(preselectedProduct ? 1 : 0);
  const [selectedProduct, setSelectedProduct] = useState<(Product & { totalQuantity?: number }) | null>(
    preselectedProduct ? (products.find((p) => p.id === preselectedProduct.id) ?? null) : null
  );
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<Omit<StockInData, 'productId'>>({
    quantity: 1,
    batchNo: '',
    expiryDate: '',
    location: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  // FIFO batches for selected product
  const productBatches = batches
    .filter((b) => b.productId === selectedProduct?.id && b.quantity > 0)
    .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());

  const handleSubmit = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      await onSubmit({ productId: selectedProduct.id, ...formData });
      setDone(true);
      setStep(3);
    } catch {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all';
  const inputStyle = { backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        style={{ backgroundColor: 'var(--surface)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>Stock In — Batch Wizard</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-6 py-4 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-hover)' }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all text-xs font-bold',
                    isDone ? 'bg-emerald-500 text-white' :
                    isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' :
                    'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  )}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn('text-[10px] font-medium whitespace-nowrap', {
                    'text-blue-600 dark:text-blue-400': isActive,
                    'text-emerald-600 dark:text-emerald-400': isDone,
                    'text-slate-400': !isActive && !isDone,
                  })}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-0.5 mx-2 mb-4 rounded transition-all', {
                    'bg-emerald-400': i < step,
                    'bg-slate-200 dark:bg-slate-700': i >= step,
                  })} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="p-6 min-h-[320px]">

          {/* Step 0: Select Product */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Select a product to stock in</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or SKU…"
                  className={cn(inputCls, 'pl-9')} style={inputStyle} />
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const stock = p.totalQuantity ?? 0;
                  const isLow = stock < p.reorderPoint;
                  return (
                    <button key={p.id} onClick={() => { setSelectedProduct(p); setStep(1); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>{p.name}</p>
                        <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{p.sku}</p>
                      </div>
                      <span className={cn('text-xs font-semibold shrink-0', isLow ? 'text-red-500' : 'text-emerald-600')}>
                        {stock} {p.unit}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <p className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>No products found</p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Batch Info */}
          {step === 1 && selectedProduct && (
            <div className="space-y-4">
              {/* Selected product pill */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)' }}>
                <Package className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{selectedProduct.name}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{selectedProduct.sku}</p>
                </div>
                <button onClick={() => setStep(0)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0">Change</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                    <Layers className="w-3.5 h-3.5 text-blue-500" /> Quantity <span className="text-red-500">*</span>
                  </label>
                  <input type="number" min="1" value={formData.quantity}
                    onChange={(e) => setFormData((p) => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                    className={inputCls} style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                    <Hash className="w-3.5 h-3.5 text-blue-500" /> Batch No.
                  </label>
                  <input value={formData.batchNo}
                    onChange={(e) => setFormData((p) => ({ ...p, batchNo: e.target.value }))}
                    placeholder="Auto-generated" className={inputCls} style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> Location
                  </label>
                  <input value={formData.location}
                    onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Shelf / Bin" className={inputCls} style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                    <Calendar className="w-3.5 h-3.5 text-blue-500" /> Expiry Date
                  </label>
                  <input type="date" value={formData.expiryDate}
                    onChange={(e) => setFormData((p) => ({ ...p, expiryDate: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Reason</label>
                  <input value={formData.reason}
                    onChange={(e) => setFormData((p) => ({ ...p, reason: e.target.value }))}
                    placeholder="Purchase order, return…" className={inputCls} style={inputStyle} />
                </div>
              </div>

              {/* FIFO batch timeline */}
              {productBatches.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                    <ArrowRight className="w-3 h-3" /> FIFO — existing batches (oldest first)
                  </p>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {productBatches.map((b, i) => (
                      <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                        style={{ backgroundColor: 'var(--surface-hover)', borderLeft: i === 0 ? '3px solid #10B981' : '3px solid var(--border)' }}>
                        <span className={cn('font-semibold shrink-0', i === 0 ? 'text-emerald-600 dark:text-emerald-400' : ''
                        )} style={i !== 0 ? { color: 'var(--muted)' } : {}}>
                          {i === 0 ? '▶ Next' : `#${i + 1}`}
                        </span>
                        <span className="font-mono truncate" style={{ color: 'var(--foreground)' }}>{b.batchNo || 'No batch'}</span>
                        <span className="ml-auto font-semibold shrink-0" style={{ color: 'var(--foreground)' }}>{b.quantity} {selectedProduct.unit}</span>
                        {b.location && <span className="text-slate-400 shrink-0">{b.location}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && selectedProduct && (
            <div className="space-y-4">
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Review before confirming</p>
              <div className="rounded-xl border divide-y" style={{ borderColor: 'var(--border)' }}>
                {[
                  { label: 'Product', value: selectedProduct.name },
                  { label: 'SKU', value: selectedProduct.sku },
                  { label: 'Quantity', value: `${formData.quantity} ${selectedProduct.unit}`, highlight: true },
                  { label: 'Batch No.', value: formData.batchNo || 'Auto-generated' },
                  { label: 'Location', value: formData.location || '—' },
                  { label: 'Expiry Date', value: formData.expiryDate || '—' },
                  { label: 'Reason', value: formData.reason || '—' },
                  { label: 'New Total Stock', value: `${(selectedProduct.totalQuantity ?? 0) + formData.quantity} ${selectedProduct.unit}`, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span style={{ color: 'var(--muted)' }}>{label}</span>
                    <span className={cn('font-medium', highlight ? 'text-emerald-600 dark:text-emerald-400' : '')}
                      style={!highlight ? { color: 'var(--foreground)' } : {}}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-pulse-once">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Stock Added!</p>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  {formData.quantity} {selectedProduct?.unit} added to {selectedProduct?.name}
                </p>
              </div>
              <button onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step < 3 && (
          <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-hover)' }}>
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 2 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 ? !selectedProduct : step === 1 ? !formData.quantity : false}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {loading ? 'Saving…' : 'Confirm Stock In'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { X, Minus, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Product, Inventory } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StockOutModalProps {
  product: Product & { totalQuantity?: number };
  batches: Inventory[];
  onSubmit: (data: { productId: string; quantity: number; reason: string }) => Promise<void>;
  onClose: () => void;
}

export function StockOutModal({ product, batches, onSubmit, onClose }: StockOutModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const available = product.totalQuantity ?? 0;
  const isInsufficient = quantity > available;

  // FIFO batches sorted oldest first
  const fifoBatches = [...batches]
    .filter((b) => b.productId === product.id && b.quantity > 0)
    .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());

  // Preview which batches will be consumed
  const preview: { batch: Inventory; deduct: number }[] = [];
  let rem = quantity;
  for (const b of fifoBatches) {
    if (rem <= 0) break;
    const d = Math.min(b.quantity, rem);
    preview.push({ batch: b, deduct: d });
    rem -= d;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInsufficient || quantity < 1) return;
    setError('');
    setLoading(true);
    try {
      await onSubmit({ productId: product.id, quantity, reason });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all';
  const inputStyle = { backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        style={{ backgroundColor: 'var(--surface)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--danger-light)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <Minus className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-red-700 dark:text-red-300">Stock Out</h2>
              <p className="text-xs text-red-500 dark:text-red-400 truncate max-w-[220px]">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Available stock pill */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: 'var(--surface-hover)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Available Stock</span>
            <span className={cn('text-sm font-bold', available === 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400')}>
              {available} {product.unit}
            </span>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
              Quantity to Remove <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg border flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number" min="1" max={available} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className={cn(inputCls, 'text-center font-semibold', isInsufficient && 'border-red-500 focus:ring-red-500/40')}
                style={inputStyle}
              />
              <button type="button"
                onClick={() => setQuantity((q) => Math.min(available, q + 1))}
                className="w-9 h-9 rounded-lg border flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                <span className="text-base leading-none">+</span>
              </button>
            </div>
            {isInsufficient && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Exceeds available stock ({available})
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>Reason</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Sale, damage, transfer, expired…"
              className={inputCls} style={inputStyle}
            />
          </div>

          {/* FIFO preview */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                <ArrowRight className="w-3 h-3" /> FIFO deduction preview
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {preview.map(({ batch, deduct }, i) => (
                  <div key={batch.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                    style={{
                      backgroundColor: 'var(--surface-hover)',
                      borderLeft: i === 0 ? '3px solid #EF4444' : '3px solid var(--border)',
                    }}>
                    <span className={cn('font-semibold shrink-0', i === 0 ? 'text-red-500' : '')}
                      style={i !== 0 ? { color: 'var(--muted)' } : {}}>
                      {i === 0 ? '▶ First' : `#${i + 1}`}
                    </span>
                    <span className="font-mono truncate" style={{ color: 'var(--foreground)' }}>
                      {batch.batchNo || 'No batch'}
                    </span>
                    <span className="ml-auto font-semibold text-red-500 shrink-0">−{deduct} {product.unit}</span>
                    <span className="text-slate-400 shrink-0">
                      ({batch.quantity - deduct} left)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
              Cancel
            </button>
            <button type="submit"
              disabled={loading || isInsufficient || quantity < 1 || available === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
              {loading ? 'Processing…' : 'Confirm Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

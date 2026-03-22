'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Package, DollarSign, Settings2, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const inputCls =
  'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';
const inputStyle = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  color: 'var(--foreground)',
};

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs" style={{ color: 'var(--muted)' }}>{hint}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{title}</p>
        {subtitle && <p className="text-xs" style={{ color: 'var(--muted)' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '', name: '', description: '', category: '', unit: 'unit',
    costPrice: '', sellingPrice: '',
    reorderPoint: '10', reorderQty: '50',
    orderingCost: '50', holdingCost: '2',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/products', formData);
      router.push('/products');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create product');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 pb-10">
      {/* Back */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-blue-600"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Add New Product</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Fill in the details below to add a product to your inventory
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Section 1: Basic Info ── */}
        <div className="card space-y-4">
          <SectionHeader icon={Package} title="Basic Information" subtitle="Identity and classification" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU" required>
              <input name="sku" required value={formData.sku} onChange={handleChange}
                className={inputCls} style={inputStyle} placeholder="SKU-001" />
            </Field>
            <Field label="Product Name" required>
              <input name="name" required value={formData.name} onChange={handleChange}
                className={inputCls} style={inputStyle} placeholder="Widget A" />
            </Field>
          </div>
          <Field label="Description">
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
              className={cn(inputCls, 'resize-none')} style={inputStyle} placeholder="Optional description…" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <input name="category" value={formData.category} onChange={handleChange}
                className={inputCls} style={inputStyle} placeholder="Electronics" />
            </Field>
            <Field label="Unit">
              <input name="unit" value={formData.unit} onChange={handleChange}
                className={inputCls} style={inputStyle} placeholder="pcs, kg, litre" />
            </Field>
          </div>
        </div>

        {/* ── Section 2: Pricing ── */}
        <div className="card space-y-4">
          <SectionHeader icon={DollarSign} title="Pricing" subtitle="Cost and selling price" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cost Price">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted)' }}>$</span>
                <input name="costPrice" type="number" step="0.01" value={formData.costPrice} onChange={handleChange}
                  className={cn(inputCls, 'pl-7')} style={inputStyle} placeholder="0.00" />
              </div>
            </Field>
            <Field label="Selling Price">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted)' }}>$</span>
                <input name="sellingPrice" type="number" step="0.01" value={formData.sellingPrice} onChange={handleChange}
                  className={cn(inputCls, 'pl-7')} style={inputStyle} placeholder="0.00" />
              </div>
            </Field>
          </div>
          {/* Live margin preview */}
          {formData.costPrice && formData.sellingPrice && (() => {
            const cost = parseFloat(formData.costPrice);
            const sell = parseFloat(formData.sellingPrice);
            const margin = cost > 0 ? (((sell - cost) / cost) * 100).toFixed(1) : null;
            const profit = (sell - cost).toFixed(2);
            const isPositive = sell >= cost;
            return (
              <div className={cn(
                'flex items-center gap-4 px-4 py-3 rounded-lg text-sm',
                isPositive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              )}>
                <span>Profit per unit: <strong>${profit}</strong></span>
                {margin && <span>Margin: <strong>{margin}%</strong></span>}
              </div>
            );
          })()}
        </div>

        {/* ── Section 3: Inventory Settings ── */}
        <div className="card space-y-4">
          <SectionHeader icon={Settings2} title="Inventory Settings" subtitle="Reorder thresholds and EOQ parameters" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Reorder Point" hint="Alert when stock falls below this">
              <input name="reorderPoint" type="number" value={formData.reorderPoint} onChange={handleChange}
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Reorder Quantity" hint="Amount to order when restocking">
              <input name="reorderQty" type="number" value={formData.reorderQty} onChange={handleChange}
                className={inputCls} style={inputStyle} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ordering Cost ($)" hint="Cost per purchase order (EOQ)">
              <input name="orderingCost" type="number" step="0.01" value={formData.orderingCost} onChange={handleChange}
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Holding Cost ($/unit/year)" hint="Storage cost per unit (EOQ)">
              <input name="holdingCost" type="number" step="0.01" value={formData.holdingCost} onChange={handleChange}
                className={inputCls} style={inputStyle} />
            </Field>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Creating…' : 'Create Product'}
          </button>
          <Link
            href="/products"
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ color: 'var(--foreground)', border: '1px solid var(--border)' }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

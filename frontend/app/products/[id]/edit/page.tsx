'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Supplier } from '@/lib/types';
import {
  ArrowLeft, Package, DollarSign, Settings2, FlaskConical,
  Truck, Save, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ── Shared field styles ────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';
const inputStyle = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  color: 'var(--foreground)',
};

function Field({
  label, hint, required, children,
}: {
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

// ── Page ───────────────────────────────────────────────────────
export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({
    sku: '', name: '', description: '', category: '', unit: 'unit',
    costPrice: '', sellingPrice: '',
    reorderPoint: '10', reorderQty: '50',
    orderingCost: '50', holdingCost: '2',
    avgDailyDemand: '5', supplierId: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const [productRes, suppliersRes] = await Promise.all([
          api.get(`/products/${productId}`),
          api.get('/suppliers'),
        ]);
        const p = productRes.data.data;
        setFormData({
          sku: p.sku, name: p.name, description: p.description || '',
          category: p.category || '', unit: p.unit,
          costPrice: p.costPrice.toString(), sellingPrice: p.sellingPrice.toString(),
          reorderPoint: p.reorderPoint.toString(), reorderQty: p.reorderQty.toString(),
          orderingCost: p.orderingCost.toString(), holdingCost: p.holdingCost.toString(),
          avgDailyDemand: p.avgDailyDemand.toString(), supplierId: p.supplierId || '',
        });
        setSuppliers(suppliersRes.data.data);
      } catch {
        alert('Failed to load product');
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/products/${productId}`, { ...formData, supplierId: formData.supplierId || null });
      router.push('/products');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product');
      setLoading(false);
    }
  };

  const annualDemand = (parseFloat(formData.avgDailyDemand || '0') * 365).toFixed(0);

  if (fetchLoading)
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );

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
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Edit Product</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Update product details, pricing and inventory settings
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
          {/* Margin preview */}
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

        {/* ── Section 3: Supplier ── */}
        <div className="card space-y-4">
          <SectionHeader icon={Truck} title="Supplier" subtitle="Link to supplier for auto-reorder" />
          <Field label="Supplier" hint="Required for automated purchase order generation">
            <select name="supplierId" value={formData.supplierId} onChange={handleChange}
              className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">— No supplier —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* ── Section 4: Inventory Settings ── */}
        <div className="card space-y-4">
          <SectionHeader icon={Settings2} title="Inventory Settings" subtitle="Reorder thresholds and EOQ parameters" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Reorder Point" hint="Alert when stock falls below this">
              <input name="reorderPoint" type="number" value={formData.reorderPoint} onChange={handleChange}
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Reorder Quantity" hint="Used when EOQ = 0">
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

        {/* ── Section 5: EOQ Testing ── */}
        <div className="card space-y-4" style={{ borderColor: 'var(--border)' }}>
          <SectionHeader icon={FlaskConical} title="EOQ Testing Parameters" subtitle="Phase 4 will auto-calculate from demand history" />
          <Field
            label="Average Daily Demand (units/day)"
            hint="Set to 0 to use manual Reorder Qty. Set to 10+ to see higher EOQ."
          >
            <input name="avgDailyDemand" type="number" step="0.1" min="0" value={formData.avgDailyDemand}
              onChange={handleChange} className={inputCls} style={inputStyle} />
          </Field>
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
            Annual Demand = {formData.avgDailyDemand} × 365 =&nbsp;<strong>{annualDemand} units/year</strong>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Saving…' : 'Save Changes'}
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

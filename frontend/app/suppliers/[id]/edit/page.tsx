'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

const inputCls =
  'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/40';

const Field = ({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
      {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
    {children}
    {hint && <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>{hint}</p>}
  </div>
);

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', leadTimeDays: '7',
  });

  useEffect(() => {
    api.get(`/suppliers/${supplierId}`)
      .then((res) => {
        const s = res.data.data;
        setFormData({
          name: s.name,
          email: s.email || '',
          phone: s.phone || '',
          address: s.address || '',
          leadTimeDays: s.leadTimeDays.toString(),
        });
      })
      .catch(() => alert('Failed to load supplier'))
      .finally(() => setFetchLoading(false));
  }, [supplierId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/suppliers/${supplierId}`, formData);
      router.push('/suppliers');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update supplier');
      setLoading(false);
    }
  };

  const sharedInputStyle = {
    backgroundColor: 'var(--surface-hover)',
    border: '1px solid var(--border)',
    color: 'var(--foreground)',
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/suppliers"
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Suppliers
      </Link>

      <Card>
        <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
          Edit Supplier
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Supplier Name" required>
            <input
              type="text" name="name" required
              value={formData.name} onChange={handleChange}
              className={inputCls} style={sharedInputStyle}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <input
                type="email" name="email"
                value={formData.email} onChange={handleChange}
                className={inputCls} style={sharedInputStyle}
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel" name="phone"
                value={formData.phone} onChange={handleChange}
                className={inputCls} style={sharedInputStyle}
              />
            </Field>
          </div>

          <Field label="Address">
            <textarea
              name="address" rows={3}
              value={formData.address} onChange={handleChange}
              className={inputCls} style={sharedInputStyle}
            />
          </Field>

          <Field
            label="Lead Time (Days)"
            hint="Average delivery time for orders from this supplier"
          >
            <input
              type="number" name="leadTimeDays" min="1"
              value={formData.leadTimeDays} onChange={handleChange}
              className={inputCls} style={sharedInputStyle}
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <Link href="/suppliers">
              <button
                type="button"
                className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface)' }}
              >
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

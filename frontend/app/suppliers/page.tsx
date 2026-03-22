'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Building2, Clock, Package, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete supplier');
    }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="h-96 rounded-xl animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Suppliers</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{suppliers.length} total suppliers</p>
        </div>
        <Link href="/suppliers/new">
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Supplier', 'Contact', 'Lead Time', 'Products', 'Orders', 'Actions'].map(h => (
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
              {suppliers.map(supplier => (
                <tr
                  key={supplier.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  {/* Supplier name */}
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: '#EFF6FF' }}
                      >
                        <Building2 className="w-4 h-4" style={{ color: '#3B82F6' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                          {supplier.name}
                        </p>
                        {supplier.address && (
                          <p className="text-xs truncate max-w-[160px]" style={{ color: 'var(--muted)' }}>
                            {supplier.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-4 pr-4">
                    <p className="text-sm" style={{ color: 'var(--foreground)' }}>{supplier.email || '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{supplier.phone || ''}</p>
                  </td>

                  {/* Lead time */}
                  <td className="py-4 pr-4">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}
                    >
                      <Clock className="w-3 h-3" />
                      {supplier.leadTimeDays} days
                    </span>
                  </td>

                  {/* Products count */}
                  <td className="py-4 pr-4">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}
                    >
                      <Package className="w-3 h-3" />
                      {supplier._count?.products ?? 0}
                    </span>
                  </td>

                  {/* Orders count */}
                  <td className="py-4 pr-4">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: '#F5F3FF', color: '#7C3AED' }}
                    >
                      <ShoppingCart className="w-3 h-3" />
                      {supplier._count?.purchaseOrders ?? 0}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4">
                    <div className="flex items-center gap-1">
                      <Link href={`/suppliers/${supplier.id}/edit`}>
                        <button
                          className="p-2 rounded-lg transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" style={{ color: '#3B82F6' }} />
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteSupplier(supplier.id)}
                        className="p-2 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#EF4444' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {suppliers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Building2 className="w-10 h-10 opacity-20" style={{ color: 'var(--muted)' }} />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No suppliers yet. Add your first supplier to get started.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { Supplier } from '@/lib/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      await api.delete(`/suppliers/${id}`);
      setSuppliers(suppliers.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete supplier');
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  if (loading) return <div className="text-center py-20">Loading suppliers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Suppliers</h1>
          <p className="text-slate-500 mt-1">{suppliers.length} total suppliers</p>
        </div>
        <Link href="/suppliers/new">
          <Button>
            <Plus className="w-4 h-4" />
            Add Supplier
          </Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr className="text-left">
                <th className="pb-3 font-semibold text-slate-700">Supplier Name</th>
                <th className="pb-3 font-semibold text-slate-700">Email</th>
                <th className="pb-3 font-semibold text-slate-700">Phone</th>
                <th className="pb-3 font-semibold text-slate-700">Lead Time</th>
                <th className="pb-3 font-semibold text-slate-700">Products</th>
                <th className="pb-3 font-semibold text-slate-700">Orders</th>
                <th className="pb-3 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-slate-50">
                  <td className="py-4 font-medium text-slate-800">{supplier.name}</td>
                  <td className="py-4 text-slate-600 text-sm">{supplier.email || '—'}</td>
                  <td className="py-4 text-slate-600 text-sm">{supplier.phone || '—'}</td>
                  <td className="py-4 text-slate-600">{supplier.leadTimeDays} days</td>
                  <td className="py-4">
                    <Badge variant="blue">{supplier._count.products}</Badge>
                  </td>
                  <td className="py-4">
                    <Badge variant="green">{supplier._count.purchaseOrders}</Badge>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <Link href={`/suppliers/${supplier.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => deleteSupplier(supplier.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {suppliers.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No suppliers yet. Add your first supplier to get started.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
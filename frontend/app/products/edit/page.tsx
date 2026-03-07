'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Product, Supplier } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    unit: 'unit',
    costPrice: '',
    sellingPrice: '',
    reorderPoint: '10',
    reorderQty: '50',
    orderingCost: '50',
    holdingCost: '2',
    avgDailyDemand: '5',  // NEW FIELD
    supplierId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, suppliersRes] = await Promise.all([
          api.get(`/products/${productId}`),
          api.get('/suppliers'),
        ]);

        const product = productRes.data.data;
        setFormData({
          sku: product.sku,
          name: product.name,
          description: product.description || '',
          category: product.category || '',
          unit: product.unit,
          costPrice: product.costPrice.toString(),
          sellingPrice: product.sellingPrice.toString(),
          reorderPoint: product.reorderPoint.toString(),
          reorderQty: product.reorderQty.toString(),
          orderingCost: product.orderingCost.toString(),
          holdingCost: product.holdingCost.toString(),
          avgDailyDemand: product.avgDailyDemand.toString(),  // NEW
          supplierId: product.supplierId || '',
        });

        setSuppliers(suppliersRes.data.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        alert('Failed to load product');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/products/${productId}`, {
        ...formData,
        supplierId: formData.supplierId || null,
      });
      router.push('/products');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (fetchLoading) {
    return <div className="text-center py-20">Loading product...</div>;
  }

  return (
    <div className="max-w-3xl">
      <Link href="/products">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Button>
      </Link>

      <Card>
        <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                required
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Unit</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Supplier 🔗
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
              >
                <option value="">None</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-600 mt-1">
                ⭐ Link to supplier for auto-reorder
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cost Price</label>
              <input
                type="number"
                name="costPrice"
                step="0.01"
                value={formData.costPrice}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Selling Price</label>
              <input
                type="number"
                name="sellingPrice"
                step="0.01"
                value={formData.sellingPrice}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="font-semibold text-slate-800 mb-4">Inventory Settings</h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reorder Point</label>
                <input
                  type="number"
                  name="reorderPoint"
                  value={formData.reorderPoint}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Alert when stock falls below this</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reorder Quantity (Manual)</label>
                <input
                  type="number"
                  name="reorderQty"
                  value={formData.reorderQty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Used when EOQ = 0</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ordering Cost</label>
                <input
                  type="number"
                  name="orderingCost"
                  step="0.01"
                  value={formData.orderingCost}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Cost per purchase order (EOQ)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Holding Cost (per unit/year)</label>
                <input
                  type="number"
                  name="holdingCost"
                  step="0.01"
                  value={formData.holdingCost}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Storage cost per unit (EOQ)</p>
              </div>
            </div>
          </div>

          {/* NEW SECTION: EOQ Parameters */}
          <div className="border-t border-slate-200 pt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
              🧪 EOQ Testing Parameters
              <span className="text-xs font-normal text-slate-500">(Phase 4 will auto-calculate)</span>
            </h3>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Average Daily Demand (units/day)
              </label>
              <input
                type="number"
                name="avgDailyDemand"
                step="0.1"
                min="0"
                value={formData.avgDailyDemand}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-600 mt-1">
                💡 <strong>Testing:</strong> Set to 0 to use manual Reorder Qty. Set to 10+ to see higher EOQ.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Annual Demand = {formData.avgDailyDemand} × 365 = <strong>{(parseFloat(formData.avgDailyDemand || '0') * 365).toFixed(0)}</strong> units/year
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Product'}
            </Button>
            <Link href="/products">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { Plus, Minus, Package } from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out'>('in');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    quantity: '',
    batchNo: '',
    expiryDate: '',
    location: '',
    reason: '',
  });

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product: Product, type: 'in' | 'out') => {
    setSelectedProduct(product);
    setModalType(type);
    setFormData({ quantity: '', batchNo: '', expiryDate: '', location: '', reason: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const endpoint = modalType === 'in' ? '/inventory/stock-in' : '/inventory/stock-out';
      await api.post(endpoint, {
        productId: selectedProduct.id,
        ...formData,
        quantity: parseInt(formData.quantity),
      });

      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) return <div className="text-center py-20">Loading inventory...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Inventory Management</h1>
        <p className="text-slate-500 mt-1">Stock in/out operations</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr className="text-left">
                <th className="pb-3 font-semibold text-slate-700">Product</th>
                <th className="pb-3 font-semibold text-slate-700">SKU</th>
                <th className="pb-3 font-semibold text-slate-700">Current Stock</th>
                <th className="pb-3 font-semibold text-slate-700">Reorder Point</th>
                <th className="pb-3 font-semibold text-slate-700">Status</th>
                <th className="pb-3 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const stock = (product as any).totalQuantity || 0;
                const isLowStock = stock < product.reorderPoint;

                return (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="py-4 font-medium text-slate-800">{product.name}</td>
                    <td className="py-4 text-slate-600 font-mono text-sm">{product.sku}</td>
                    <td className="py-4">
                      <span className={isLowStock ? 'text-red-600 font-semibold' : 'text-slate-800 font-semibold'}>
                        {stock} {product.unit}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600">{product.reorderPoint}</td>
                    <td className="py-4">
                      <Badge variant={isLowStock ? 'red' : stock === 0 ? 'gray' : 'green'}>
                        {stock === 0 ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'Healthy'}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => openModal(product, 'in')}>
                          <Plus className="w-4 h-4" />
                          Stock In
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => openModal(product, 'out')}>
                          <Minus className="w-4 h-4" />
                          Stock Out
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {modalType === 'in' ? '📦 Stock In' : '📤 Stock Out'} — {selectedProduct.name}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quantity"
                />
              </div>

              {modalType === 'in' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Batch Number</label>
                    <input
                      type="text"
                      value={formData.batchNo}
                      onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Shelf / Bin"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={modalType === 'in' ? 'Purchase order, production...' : 'Sale, damage, transfer...'}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit">Confirm {modalType === 'in' ? 'Stock In' : 'Stock Out'}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) return <div className="text-center py-20">Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-500 mt-1">{products.length} total products</p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200">
              <tr className="text-left">
                <th className="pb-3 font-semibold text-slate-700">SKU</th>
                <th className="pb-3 font-semibold text-slate-700">Product Name</th>
                <th className="pb-3 font-semibold text-slate-700">Category</th>
                <th className="pb-3 font-semibold text-slate-700">Stock</th>
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
                    <td className="py-4 text-slate-600 font-mono text-sm">{product.sku}</td>
                    <td className="py-4 font-medium text-slate-800">{product.name}</td>
                    <td className="py-4 text-slate-600">{product.category || '—'}</td>
                    <td className="py-4">
                      <span className={isLowStock ? 'text-red-600 font-semibold' : 'text-slate-800'}>
                        {stock} {product.unit}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600">{product.reorderPoint}</td>
                    <td className="py-4">
                      <Badge variant={isLowStock ? 'red' : stock === 0 ? 'gray' : 'green'}>
                        {stock === 0 ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <Link href={`/products/${product.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No products yet. Add your first product to get started.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

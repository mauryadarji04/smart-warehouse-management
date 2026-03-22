'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/ui/ProductCard';
import { FilterBar, FilterState } from '@/components/ui/FilterBar';
import { cn } from '@/lib/utils';
import {
  Plus, LayoutGrid, List, Trash2, Tag, Truck,
  Download, ArrowUpDown, ArrowUp, ArrowDown, X,
  CheckSquare, Undo2, Redo2,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ExportMenu } from '@/components/ui/ExportMenu';
import { useUndoRedo } from '@/components/ui/useUndoRedo';

type SortKey = 'name' | 'sku' | 'category' | 'stock' | 'reorderPoint' | 'costPrice' | 'sellingPrice';
type SortDir = 'asc' | 'desc';

function stockStatus(stock: number, reorderPoint: number) {
  if (stock === 0) return 'out-of-stock';
  if (stock < reorderPoint) return 'low-stock';
  return 'in-stock';
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
  return sortDir === 'asc'
    ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
    : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />;
}

function StockCell({ stock, reorderPoint, unit }: { stock: number; reorderPoint: number; unit: string }) {
  const status = stockStatus(stock, reorderPoint);
  return (
    <span className={cn('font-semibold tabular-nums', {
      'text-red-600 dark:text-red-400': status === 'low-stock',
      'text-slate-400': status === 'out-of-stock',
      'text-slate-800 dark:text-slate-200': status === 'in-stock',
    })}>
      {stock} <span className="text-xs font-normal text-slate-400">{unit}</span>
    </span>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<(Product & { totalQuantity?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'card' | 'table'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filters, setFilters] = useState<FilterState>({ search: '', categories: [], stockStatus: 'all' });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const { value: undoProducts, set: setUndoProducts, undo, redo, canUndo, canRedo } = useUndoRedo<(Product & { totalQuantity?: number })[]>([]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data);
      setUndoProducts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Sync undo stack → products display
  useEffect(() => {
    if (undoProducts.length > 0 || products.length > 0) setProducts(undoProducts);
  }, [undoProducts]); // eslint-disable-line

  const deleteProduct = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      const next = products.filter((p) => p.id !== id);
      setUndoProducts(next);
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const allCategories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean) as string[])].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const stock = p.totalQuantity ?? 0;
      const q = filters.search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(p.category ?? '')) return false;
      if (filters.stockStatus !== 'all' && stockStatus(stock, p.reorderPoint) !== filters.stockStatus) return false;
      return true;
    });
  }, [products, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: any, bv: any;
      if (sortKey === 'stock') { av = a.totalQuantity ?? 0; bv = b.totalQuantity ?? 0; }
      else if (sortKey === 'costPrice' || sortKey === 'sellingPrice' || sortKey === 'reorderPoint') {
        av = a[sortKey]; bv = b[sortKey];
      } else {
        av = (a[sortKey] ?? '').toString().toLowerCase();
        bv = (b[sortKey] ?? '').toString().toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleAll = () =>
    setSelected(selected.size === sorted.length ? new Set() : new Set(sorted.map((p) => p.id)));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const bulkDelete = async () => {
    await Promise.all([...selected].map((id) => api.delete(`/products/${id}`).catch(() => {})));
    const next = products.filter((p) => !selected.has(p.id));
    setUndoProducts(next);
    setSelected(new Set());
    setConfirmBulk(false);
  };

  const exportCSV = () => {
    const rows = sorted
      .filter((p) => selected.size === 0 || selected.has(p.id))
      .map((p) => [p.sku, p.name, p.category ?? '', p.totalQuantity ?? 0, p.reorderPoint, p.costPrice, p.sellingPrice].join(','));
    const csv = ['SKU,Name,Category,Stock,Reorder Point,Cost,Selling Price', ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'products.csv';
    a.click();
  };

  const COLS: { key: SortKey; label: string }[] = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'stock', label: 'Stock' },
    { key: 'reorderPoint', label: 'Reorder Pt.' },
    { key: 'costPrice', label: 'Cost' },
    { key: 'sellingPrice', label: 'Sell Price' },
  ];

  if (loading)
    return (
      <div className="space-y-6 pb-24">
        <div className="flex flex-wrap gap-3 justify-between items-start">
          <div className="space-y-2">
            <div className="h-8 w-32 animate-shimmer rounded-lg" />
            <div className="h-4 w-24 animate-shimmer rounded" />
          </div>
          <div className="h-10 w-40 animate-shimmer rounded-lg" />
        </div>
        <div className="card h-16 animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-wrap gap-3 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Products</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {sorted.length} of {products.length} products
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <button
              onClick={() => setView('card')}
              className={cn('px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors', {
                'bg-blue-600 text-white': view === 'card',
                'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800': view !== 'card',
              })}
            >
              <LayoutGrid className="w-4 h-4" /> Cards
            </button>
            <button
              onClick={() => setView('table')}
              className={cn('px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors', {
                'bg-blue-600 text-white': view === 'table',
                'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800': view !== 'table',
              })}
            >
              <List className="w-4 h-4" /> Table
            </button>
          </div>

          <ExportMenu
            data={sorted.map((p) => ({
              SKU: p.sku, Name: p.name, Category: p.category ?? '',
              Stock: p.totalQuantity ?? 0, 'Reorder Point': p.reorderPoint,
              Cost: p.costPrice, 'Sell Price': p.sellingPrice,
            }))}
            filename="products"
          />

          {/* Undo / Redo */}
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={undo} disabled={!canUndo}
              className="px-2.5 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
              style={{ color: 'var(--foreground)' }} title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo} disabled={!canRedo}
              className="px-2.5 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 border-l"
              style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }} title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/products/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <FilterBar filters={filters} onChange={setFilters} allCategories={allCategories} products={products} />
      </div>

      {/* Card view */}
      {view === 'card' && (
        <>
          {sorted.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sorted.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selected.has(product.id)}
                  onSelect={toggleSelect}
                  onDelete={(id) => {
                    const p = products.find((x) => x.id === id);
                    if (p) setConfirmDelete({ id, name: p.name });
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Table view */}
      {view === 'table' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-hover)' }}>
                  <th className="w-10 px-4 py-3">
                    <button
                      onClick={toggleAll}
                      aria-label="Select all"
                      className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all', {
                        'bg-blue-600 border-blue-600': selected.size === sorted.length && sorted.length > 0,
                        'border-slate-300 dark:border-slate-600': selected.size !== sorted.length || sorted.length === 0,
                      })}
                    >
                      {selected.size === sorted.length && sorted.length > 0 && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  {COLS.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--muted)' }}>
                      <button onClick={() => handleSort(col.key)} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                        {col.label}
                        <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--muted)' }}>Status</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={COLS.length + 3} className="text-center py-16 text-slate-400">
                      No products match your filters.
                    </td>
                  </tr>
                )}
                {sorted.map((product) => {
                  const stock = product.totalQuantity ?? 0;
                  const status = stockStatus(stock, product.reorderPoint);
                  const isSelected = selected.has(product.id);
                  return (
                    <tr
                      key={product.id}
                      className={cn('transition-colors', {
                        'bg-blue-50/50 dark:bg-blue-900/10': isSelected,
                        'hover:bg-slate-50 dark:hover:bg-slate-800/50': !isSelected,
                      })}
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(product.id)}
                          aria-label={`Select ${product.name}`}
                          className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-all', {
                            'bg-blue-600 border-blue-600': isSelected,
                            'border-slate-300 dark:border-slate-600': !isSelected,
                          })}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{product.sku}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>{product.name}</td>
                      <td className="px-4 py-3">
                        {product.category ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            {product.category}
                          </span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StockCell stock={stock} reorderPoint={product.reorderPoint} unit={product.unit} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{product.reorderPoint}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">${product.costPrice}</td>
                      <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">${product.sellingPrice}</td>
                      <td className="px-4 py-3">
                        <Badge variant={status === 'in-stock' ? 'green' : status === 'low-stock' ? 'red' : 'gray'}>
                          {status === 'in-stock' ? 'In Stock' : status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/products/${product.id}/edit`}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => setConfirmDelete({ id: product.id, name: product.name })}
                            aria-label={`Delete ${product.name}`}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 pr-3 border-r" style={{ borderColor: 'var(--border)' }}>
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {selected.size} selected
              </span>
            </div>
            <button
              onClick={() => setConfirmBulk(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              <Tag className="w-3.5 h-3.5" /> Category
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              <Truck className="w-3.5 h-3.5" /> Supplier
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-1 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Product?"
        description="This will permanently remove the product and all associated inventory records."
        confirmLabel="Delete Product"
        preview={confirmDelete && (
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-semibold">{confirmDelete.name}</span>
          </div>
        )}
        onConfirm={() => { if (confirmDelete) { deleteProduct(confirmDelete.id); setConfirmDelete(null); } }}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={confirmBulk}
        title={`Delete ${selected.size} Products?`}
        description="All selected products and their inventory records will be permanently deleted."
        confirmLabel={`Delete ${selected.size} Products`}
        preview={
          <ul className="space-y-1 text-sm">
            {[...selected].slice(0, 5).map((id) => {
              const p = products.find((x) => x.id === id);
              return p ? (
                <li key={id} className="flex items-center gap-1.5">
                  <Trash2 className="w-3 h-3 text-red-400 shrink-0" />{p.name}
                </li>
              ) : null;
            })}
            {selected.size > 5 && (
              <li className="text-xs" style={{ color: 'var(--muted)' }}>…and {selected.size - 5} more</li>
            )}
          </ul>
        }
        onConfirm={bulkDelete}
        onCancel={() => setConfirmBulk(false)}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card flex flex-col items-center justify-center py-24 text-center animate-fade-in" role="status" aria-label="No products found">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center shadow-inner">
          <svg className="w-12 h-12 text-blue-400 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-400 opacity-60 animate-bounce" style={{ animationDelay: '0s' }} />
        <span className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-indigo-400 opacity-40 animate-bounce" style={{ animationDelay: '0.3s' }} />
      </div>
      <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>No products yet</p>
      <p className="text-sm mt-1 max-w-xs" style={{ color: 'var(--muted)' }}>
        Your catalog is empty. Add your first product to start tracking inventory.
      </p>
      <Link
        href="/products/new"
        className="mt-5 focus-ring touch-target flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold transition-all shadow-sm"
        aria-label="Add your first product"
      >
        <Plus className="w-4 h-4" aria-hidden="true" /> Add Product
      </Link>
    </div>
  );
}

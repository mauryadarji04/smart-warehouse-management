'use client';

import { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Pencil, Trash2, TrendingDown, CheckCircle2, XCircle,
  MoreVertical, Eye, Upload, ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ProductCardProps {
  product: Product & { totalQuantity?: number };
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function StockBadge({ stock, reorderPoint }: { stock: number; reorderPoint: number }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <XCircle className="w-3 h-3" /> Out of Stock
      </span>
    );
  if (stock < reorderPoint)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <TrendingDown className="w-3 h-3" /> Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <CheckCircle2 className="w-3 h-3" /> In Stock
    </span>
  );
}

const AVATAR_GRADIENTS = [
  ['#3B82F6', '#2563EB'],
  ['#8B5CF6', '#7C3AED'],
  ['#10B981', '#0D9488'],
  ['#F59E0B', '#EA580C'],
  ['#F43F5E', '#EC4899'],
  ['#06B6D4', '#3B82F6'],
];

function avatarGradient(name: string) {
  const [from, to] = AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
  return { background: `linear-gradient(135deg, ${from}, ${to})` };
}

export function ProductCard({ product, selected, onSelect, onDelete }: ProductCardProps) {
  const stock = product.totalQuantity ?? 0;
  const isLow = stock < product.reorderPoint;
  const initials = product.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImgSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={cn(
        'card relative flex flex-col gap-3 transition-all duration-200 group hover:-translate-y-1',
        selected && 'ring-2 ring-blue-500'
      )}
      role="article"
      aria-label={`Product: ${product.name}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onSelect(product.id)}
        aria-label={selected ? `Deselect ${product.name}` : `Select ${product.name}`}
        aria-pressed={selected}
        className={cn(
          'absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center transition-all z-10',
          selected
            ? 'bg-blue-600 border-blue-600'
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 opacity-0 group-hover:opacity-100'
        )}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Context menu */}
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => window.location.href = `/products/${product.id}/edit`} className="flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => fileRef.current?.click()} className="flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" /> Upload Image
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete(product.id)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* Product image / avatar */}
      <div className="w-full aspect-video rounded-lg overflow-hidden relative">
        {imgSrc ? (
          <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center" style={avatarGradient(product.name)}>
            <span className="text-3xl font-black text-white/90 tracking-tight">{initials}</span>
            <span className="text-[10px] text-white/60 mt-1 font-mono uppercase">{product.sku}</span>
          </div>
        )}
        {/* Zoom / view overlay */}
        <Link
          href={`/products/${product.id}/edit`}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        >
          <Eye className="w-8 h-8 text-white drop-shadow-lg scale-90 group-hover:scale-100 transition-transform" />
        </Link>
        {/* Upload hint when no image */}
        {!imgSrc && (
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white rounded-md px-2 py-1 text-[10px] flex items-center gap-1"
          >
            <ImageIcon className="w-3 h-3" /> Add photo
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 space-y-2">
        <div>
          <p className="font-bold text-sm leading-snug" style={{ color: 'var(--foreground)' }}>
            {product.name}
          </p>
          <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--muted)' }}>
            {product.sku}
          </p>
        </div>

        {product.category && (
          <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 font-medium">
            {product.category}
          </span>
        )}

        <div className="flex items-center justify-between pt-1">
          <StockBadge stock={stock} reorderPoint={product.reorderPoint} />
          <span className={cn('text-sm font-bold tabular-nums', isLow ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200')}>
            {stock} <span className="text-xs font-normal text-slate-400">{product.unit}</span>
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5" style={{ color: 'var(--muted)' }}>
          <span>Cost: <strong className="text-slate-700 dark:text-slate-200">${product.costPrice}</strong></span>
          <span>Sell: <strong className="text-emerald-600 dark:text-emerald-400">${product.sellingPrice}</strong></span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
        <Link
          href={`/products/${product.id}/edit`}
          aria-label={`Edit ${product.name}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 focus-ring"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </Link>
        <button
          onClick={() => onDelete(product.id)}
          aria-label={`Delete ${product.name}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 focus-ring"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

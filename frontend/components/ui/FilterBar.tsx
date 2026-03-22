'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X, ChevronDown, SlidersHorizontal, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export type StockStatus = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';

export interface FilterState {
  search: string;
  categories: string[];
  stockStatus: StockStatus;
}

const PRESETS: { label: string; filter: Partial<FilterState> }[] = [
  { label: '⚠️ Low Stock Items', filter: { stockStatus: 'low-stock' } },
  { label: '📦 In Stock', filter: { stockStatus: 'in-stock' } },
  { label: '🚫 Out of Stock', filter: { stockStatus: 'out-of-stock' } },
];

const STATUS_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'in-stock', label: 'In Stock' },
  { value: 'low-stock', label: 'Low Stock' },
  { value: 'out-of-stock', label: 'Out of Stock' },
];

interface FilterBarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  allCategories: string[];
  products: Product[];
}

export function FilterBar({ filters, onChange, allCategories, products }: FilterBarProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!filters.search.trim()) { setSuggestions([]); return; }
    const q = filters.search.toLowerCase();
    const matches = products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 6)
      .map((p) => p.name);
    setSuggestions([...new Set(matches)]);
  }, [filters.search, products]);

  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (filters.stockStatus !== 'all')
    activeChips.push({
      label: `Status: ${filters.stockStatus.replace('-', ' ')}`,
      onRemove: () => update({ stockStatus: 'all' }),
    });
  filters.categories.forEach((c) =>
    activeChips.push({
      label: c,
      onRemove: () => update({ categories: filters.categories.filter((x) => x !== c) }),
    })
  );

  const toggleCategory = (cat: string) =>
    update({
      categories: filters.categories.includes(cat)
        ? filters.categories.filter((c) => c !== cat)
        : [...filters.categories, cat],
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search with autocomplete */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchRef}
            value={filters.search}
            onChange={(e) => { update({ search: e.target.value }); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search products or SKU…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul
              className="absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-30 overflow-hidden animate-fade-in"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    onMouseDown={() => { update({ search: s }); setSuggestions([]); setShowSuggestions(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <Search className="w-3 h-3 text-slate-400 shrink-0" />
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Stock Status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {STATUS_OPTIONS.find((s) => s.value === filters.stockStatus)?.label ?? 'All Status'}
            <ChevronDown className="w-3.5 h-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Stock Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={filters.stockStatus === opt.value}
                onCheckedChange={() => update({ stockStatus: opt.value })}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Category multi-select */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Categories
            {filters.categories.length > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {filters.categories.length}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Categories</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allCategories.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-400">No categories</p>
            ) : (
              allCategories.map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat}
                  checked={filters.categories.includes(cat)}
                  onCheckedChange={() => toggleCategory(cat)}
                >
                  {cat}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Saved presets */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Presets
            <ChevronDown className="w-3.5 h-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Saved Presets</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PRESETS.map((p) => (
              <DropdownMenuItem key={p.label} onSelect={() => onChange({ ...filters, ...p.filter })}>
                {p.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear all */}
        {activeChips.length > 0 && (
          <button
            onClick={() => onChange({ search: '', categories: [], stockStatus: 'all' })}
            className="text-xs text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              {chip.label}
              <button onClick={chip.onRemove} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

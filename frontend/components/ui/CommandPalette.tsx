'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Package, Warehouse, AlertCircle, BarChart3,
  Users, ShoppingCart, Repeat, TrendingUp, ArrowRight,
  Clock, Zap, X,
} from 'lucide-react';
import { clsx } from 'clsx';

// ── Types ─────────────────────────────────────────────────────

type ResultType = 'page' | 'command' | 'recent';

interface SearchResult {
  id: string;
  type: ResultType;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string;
}

// ── Static commands ───────────────────────────────────────────

const PAGES: Omit<SearchResult, 'action'>[] = [
  { id: 'dashboard',  type: 'page', label: 'Dashboard',        description: 'Overview & KPIs',          icon: BarChart3,    keywords: 'home overview stats' },
  { id: 'products',   type: 'page', label: 'Products',         description: 'Manage product catalog',   icon: Package,      keywords: 'items sku catalog' },
  { id: 'inventory',  type: 'page', label: 'Inventory',        description: 'Stock levels & batches',   icon: Warehouse,    keywords: 'stock batches warehouse' },
  { id: 'reorder',    type: 'page', label: 'Auto-Reorder',     description: 'EOQ reorder rules',        icon: Repeat,       keywords: 'eoq reorder automation' },
  { id: 'analytics',  type: 'page', label: 'Analytics',        description: 'Charts & forecasting',     icon: TrendingUp,   keywords: 'charts reports abc forecast' },
  { id: 'alerts',     type: 'page', label: 'Alerts',           description: 'Notifications & warnings', icon: AlertCircle,  keywords: 'notifications low stock expiry' },
  { id: 'suppliers',  type: 'page', label: 'Suppliers',        description: 'Supplier management',      icon: Users,        keywords: 'vendors contacts' },
  { id: 'orders',     type: 'page', label: 'Purchase Orders',  description: 'PO management',            icon: ShoppingCart, keywords: 'po purchase buy' },
];

const COMMANDS: Omit<SearchResult, 'action'>[] = [
  { id: 'cmd-new-product',  type: 'command', label: 'Create Product',    description: 'Add a new product to catalog', icon: Package,      keywords: 'add new product create' },
  { id: 'cmd-new-supplier', type: 'command', label: 'Add Supplier',      description: 'Register a new supplier',      icon: Users,        keywords: 'add supplier vendor' },
  { id: 'cmd-new-order',    type: 'command', label: 'New Purchase Order',description: 'Create a purchase order',       icon: ShoppingCart, keywords: 'create po order buy' },
  { id: 'cmd-low-stock',    type: 'command', label: 'View Low Stock',    description: 'Filter low stock alerts',      icon: AlertCircle,  keywords: 'low stock warning' },
  { id: 'cmd-forecast',     type: 'command', label: 'Run Forecast',      description: 'Go to analytics forecasting',  icon: TrendingUp,   keywords: 'forecast demand predict' },
  { id: 'cmd-analytics',    type: 'command', label: 'Go to Analytics',   description: 'Open analytics dashboard',     icon: BarChart3,    keywords: 'analytics charts' },
];

const RECENT_KEY = 'cmd-palette-recent';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

function saveRecent(id: string) {
  const prev = loadRecent().filter((r) => r !== id);
  localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, MAX_RECENT)));
}

// ── Fuzzy match ───────────────────────────────────────────────

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setRecentIds(loadRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const navigate = useCallback((path: string, id: string) => {
    saveRecent(id);
    setRecentIds(loadRecent());
    router.push(path);
    onClose();
  }, [router, onClose]);

  // Build results
  const allResults: SearchResult[] = [
    ...PAGES.map((p) => ({ ...p, action: () => navigate(`/${p.id === 'dashboard' ? '' : p.id}`, p.id) })),
    ...COMMANDS.map((c) => ({
      ...c,
      action: () => {
        const routes: Record<string, string> = {
          'cmd-new-product':  '/products/new',
          'cmd-new-supplier': '/suppliers/new',
          'cmd-new-order':    '/orders/new',
          'cmd-low-stock':    '/alerts?filter=LOW_STOCK',
          'cmd-forecast':     '/analytics',
          'cmd-analytics':    '/analytics',
        };
        navigate(routes[c.id] || '/', c.id);
      },
    })),
  ];

  const results: SearchResult[] = query.trim()
    ? allResults.filter((r) =>
        fuzzyMatch(query, r.label) ||
        fuzzyMatch(query, r.description || '') ||
        fuzzyMatch(query, r.keywords || '')
      )
    : [];

  const recentResults: SearchResult[] = !query.trim()
    ? recentIds.flatMap((id) => allResults.filter((r) => r.id === id))
    : [];

  const displayed = query.trim() ? results : recentResults;

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, displayed.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && displayed[selected]) { displayed[selected].action(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, displayed, selected, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  useEffect(() => { setSelected(0); }, [query]);

  if (!open) return null;

  const pages    = results.filter((r) => r.type === 'page');
  const commands = results.filter((r) => r.type === 'command');

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--muted)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, pages, commands…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            style={{ color: 'var(--foreground)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700">
              <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            </button>
          )}
          <kbd
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border"
            style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
          {!query.trim() && recentResults.length === 0 && (
            <EmptyState icon={Zap} text="Type to search products, pages, or run commands" />
          )}

          {!query.trim() && recentResults.length > 0 && (
            <Section label="Recent" icon={Clock}>
              {recentResults.map((r, i) => (
                <ResultRow key={r.id} result={r} idx={i} selected={selected} onSelect={setSelected} />
              ))}
            </Section>
          )}

          {query.trim() && results.length === 0 && (
            <EmptyState icon={Search} text={`No results for "${query}"`} />
          )}

          {query.trim() && pages.length > 0 && (
            <Section label="Pages">
              {pages.map((r, i) => (
                <ResultRow key={r.id} result={r} idx={i} selected={selected} onSelect={setSelected} />
              ))}
            </Section>
          )}

          {query.trim() && commands.length > 0 && (
            <Section label="Commands">
              {commands.map((r, i) => (
                <ResultRow key={r.id} result={r} idx={pages.length + i} selected={selected} onSelect={setSelected} />
              ))}
            </Section>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 py-2.5 border-t text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)', backgroundColor: 'var(--surface-hover)' }}
        >
          <span className="flex items-center gap-1"><Kbd>↑↓</Kbd> navigate</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
          <span className="flex items-center gap-1"><Kbd>Esc</Kbd> close</span>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function Section({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-4 py-1.5">
        {Icon && <Icon className="w-3 h-3" style={{ color: 'var(--muted)' }} />}
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function ResultRow({ result, idx, selected, onSelect }: {
  result: SearchResult;
  idx: number;
  selected: number;
  onSelect: (i: number) => void;
}) {
  const Icon = result.icon;
  const isSelected = idx === selected;
  return (
    <button
      data-idx={idx}
      onClick={result.action}
      onMouseEnter={() => onSelect(idx)}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
        isSelected ? 'bg-blue-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
      )}
    >
      <div className={clsx(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
      )}>
        <Icon className={clsx('w-4 h-4', isSelected ? 'text-white' : '')} style={!isSelected ? { color: 'var(--muted)' } : {}} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium truncate', isSelected ? 'text-white' : '')} style={!isSelected ? { color: 'var(--foreground)' } : {}}>
          {result.label}
        </p>
        {result.description && (
          <p className={clsx('text-xs truncate', isSelected ? 'text-blue-100' : '')} style={!isSelected ? { color: 'var(--muted)' } : {}}>
            {result.description}
          </p>
        )}
      </div>
      <ArrowRight className={clsx('w-3.5 h-3.5 shrink-0', isSelected ? 'text-white' : 'opacity-0 group-hover:opacity-100')} />
    </button>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <Icon className="w-8 h-8 opacity-20" style={{ color: 'var(--foreground)' }} />
      <p className="text-sm" style={{ color: 'var(--muted)' }}>{text}</p>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}
    >
      {children}
    </kbd>
  );
}

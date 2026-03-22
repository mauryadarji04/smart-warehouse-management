'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    PackagePlus, PackageMinus, SlidersHorizontal, Skull,
    Calendar, Download, RefreshCw, Filter, Clock, ChevronDown, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { TransactionType } from '@/lib/types';

interface StockTransaction {
    id: string;
    type: TransactionType;
    quantity: number;
    reason?: string;
    batchNo?: string;
    createdAt: string;
    product: {
        id: string;
        name: string;
        sku: string;
        unit: string;
    };
    user?: {
        name: string;
    };
}

const TYPE_META: Record<TransactionType, { label: string; icon: React.ElementType; color: string; bg: string; dotColor: string }> = {
    STOCK_IN: { label: 'Stock In', icon: PackagePlus, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', dotColor: '#10B981' },
    STOCK_OUT: { label: 'Stock Out', icon: PackageMinus, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', dotColor: '#3B82F6' },
    ADJUSTMENT: { label: 'Adjustment', icon: SlidersHorizontal, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', dotColor: '#F59E0B' },
    EXPIRED_REMOVAL: { label: 'Expired Removal', icon: Skull, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', dotColor: '#EF4444' },
};

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function formatDateForInput(iso: string) {
    return iso.split('T')[0];
}
function todayInput() {
    return new Date().toISOString().split('T')[0];
}
function thirtyDaysAgo() {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
}

export function StockMovementHistory() {
    const [transactions, setTransactions] = useState<StockTransaction[]>([]);
    const [filtered, setFiltered] = useState<StockTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState(thirtyDaysAgo());
    const [toDate, setToDate] = useState(todayInput());
    const [typeFilter, setTypeFilter] = useState<TransactionType | 'ALL'>('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/inventory/transactions', {
                params: { from: fromDate, to: toDate },
            });
            setTransactions(res.data.data ?? []);
        } catch {
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, refreshKey]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    useEffect(() => {
        let result = transactions;
        if (typeFilter !== 'ALL') result = result.filter((t) => t.type === typeFilter);
        setFiltered(result);
    }, [transactions, typeFilter]);

    // Export to CSV
    const exportCSV = () => {
        const headers = ['Date', 'Time', 'Type', 'Product', 'SKU', 'Quantity', 'Unit', 'Batch', 'Reason', 'User'];
        const rows = filtered.map((t) => [
            formatDate(t.createdAt),
            formatTime(t.createdAt),
            TYPE_META[t.type]?.label ?? t.type,
            t.product.name,
            t.product.sku,
            t.quantity,
            t.product.unit,
            t.batchNo ?? '',
            t.reason ?? '',
            t.user?.name ?? '',
        ]);
        const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-movements-${fromDate}-to-${toDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Group by date
    const grouped = filtered.reduce<Record<string, StockTransaction[]>>((acc, t) => {
        const d = formatDate(t.createdAt);
        (acc[d] = acc[d] ?? []).push(t);
        return acc;
    }, {});
    const sortedDates = Object.keys(grouped).sort((a, b) =>
        new Date(b).getTime() - new Date(a).getTime()
    );

    const typeOptions: { value: TransactionType | 'ALL'; label: string }[] = [
        { value: 'ALL', label: 'All Types' },
        { value: 'STOCK_IN', label: 'Stock In' },
        { value: 'STOCK_OUT', label: 'Stock Out' },
        { value: 'ADJUSTMENT', label: 'Adjustment' },
        { value: 'EXPIRED_REMOVAL', label: 'Expired Removal' },
    ];

    return (
        <div className="rounded-xl border animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Stock Movement History</h3>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{filtered.length} transactions</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters((v) => !v)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                            showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        )}
                        style={!showFilters ? { borderColor: 'var(--border)', color: 'var(--muted)' } : {}}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        Filters
                        {typeFilter !== 'ALL' && (
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] flex items-center justify-center font-bold">1</span>
                        )}
                    </button>
                    <button
                        onClick={() => setRefreshKey((k) => k + 1)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        style={{ color: 'var(--muted)' }}
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={exportCSV}
                        disabled={filtered.length === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            {showFilters && (
                <div className="px-5 py-3 border-b flex flex-wrap items-center gap-3 animate-slide-up" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-hover)' }}>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                        <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>From</label>
                        <input
                            type="date"
                            value={fromDate}
                            max={toDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-2.5 py-1 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>To</label>
                        <input
                            type="date"
                            value={toDate}
                            min={fromDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-2.5 py-1 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'ALL')}
                            className="appearance-none pl-3 pr-7 py-1 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        >
                            {typeOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: 'var(--muted)' }} />
                    </div>
                    {(typeFilter !== 'ALL') && (
                        <button
                            onClick={() => { setTypeFilter('ALL'); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <X className="w-3 h-3" /> Clear
                        </button>
                    )}

                    {/* Legend chips */}
                    <div className="ml-auto flex items-center gap-2 flex-wrap">
                        {(Object.keys(TYPE_META) as TransactionType[]).map((type) => {
                            const meta = TYPE_META[type];
                            const Icon = meta.icon;
                            return (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(typeFilter === type ? 'ALL' : type)}
                                    className={cn(
                                        'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all',
                                        typeFilter === type ? 'ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100'
                                    )}
                                    style={{
                                        borderColor: meta.dotColor + '60',
                                        backgroundColor: meta.dotColor + '18',
                                        color: meta.dotColor,
                                        ['--tw-ring-color' as any]: meta.dotColor,
                                    }}
                                >
                                    <Icon className="w-3 h-3" />
                                    {meta.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="p-5 max-h-[520px] overflow-y-auto">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full animate-shimmer shrink-0" />
                                <div className="flex-1 space-y-1.5 pt-1">
                                    <div className="h-3 rounded animate-shimmer w-1/3" />
                                    <div className="h-2.5 rounded animate-shimmer w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-3">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface-hover)' }}>
                            <Clock className="w-7 h-7" style={{ color: 'var(--muted)' }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>No transactions found</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Try adjusting the date range or filters</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sortedDates.map((date) => (
                            <div key={date}>
                                {/* Date group header */}
                                <div className="flex items-center gap-2 mb-3 sticky top-0 z-10 py-1" style={{ backgroundColor: 'var(--surface)' }}>
                                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                        style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--muted)' }}>
                                        <Calendar className="w-3 h-3" />
                                        {date}
                                    </div>
                                    <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                                        {grouped[date].length} event{grouped[date].length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Transaction items */}
                                <div className="relative pl-4">
                                    {/* Vertical line */}
                                    <div className="absolute left-4 top-0 bottom-0 w-px" style={{ backgroundColor: 'var(--border)' }} />

                                    <div className="space-y-3">
                                        {grouped[date].map((tx) => {
                                            const meta = TYPE_META[tx.type];
                                            const Icon = meta.icon;
                                            return (
                                                <div key={tx.id} className="relative flex items-start gap-3 pl-6 animate-fade-in">
                                                    {/* Timeline dot */}
                                                    <div
                                                        className="absolute left-0 top-2 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 -translate-x-1/2 shrink-0"
                                                        style={{ backgroundColor: meta.dotColor }}
                                                    />
                                                    {/* Icon bubble */}
                                                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', meta.bg)}>
                                                        <Icon className={cn('w-4 h-4', meta.color)} />
                                                    </div>
                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 rounded-xl border p-3 transition-all hover:shadow-md"
                                                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className={cn('text-xs font-semibold', meta.color)}>{meta.label}</span>
                                                                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--muted)' }}>
                                                                        {tx.product.sku}
                                                                    </span>
                                                                    {tx.batchNo && (
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                                                                            Batch: {tx.batchNo}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm font-medium mt-0.5 truncate" style={{ color: 'var(--foreground)' }}>
                                                                    {tx.product.name}
                                                                </p>
                                                                {tx.reason && (
                                                                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{tx.reason}</p>
                                                                )}
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className={cn('text-sm font-bold', meta.color)}>
                                                                    {tx.type === 'STOCK_OUT' || tx.type === 'EXPIRED_REMOVAL' ? '−' : '+'}
                                                                    {tx.quantity} {tx.product.unit}
                                                                </p>
                                                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{formatTime(tx.createdAt)}</p>
                                                            </div>
                                                        </div>
                                                        {tx.user && (
                                                            <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                                                                <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 inline-flex items-center justify-center text-[8px] font-bold" style={{ color: 'var(--foreground)' }}>
                                                                    {tx.user.name.charAt(0).toUpperCase()}
                                                                </span>
                                                                {tx.user.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

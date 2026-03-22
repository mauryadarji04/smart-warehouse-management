'use client';

import { clsx } from 'clsx';

interface StockProgressBarProps {
    label: string;
    current: number;
    capacity: number;
    unit?: string;
}

function getColorClass(pct: number) {
    if (pct >= 80) return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', label: 'Critical' };
    if (pct >= 60) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'High' };
    if (pct >= 30) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'Good' };
    return { bar: 'bg-blue-400', text: 'text-blue-500 dark:text-blue-400', label: 'Low' };
}

export function StockProgressBar({ label, current, capacity, unit = 'units' }: StockProgressBarProps) {
    const pct = capacity > 0 ? Math.min(100, Math.round((current / capacity) * 100)) : 0;
    const { bar, text, label: statusLabel } = getColorClass(pct);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[60%]">
                    {label}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={clsx('text-xs font-semibold', text)}>{statusLabel}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {current}/{capacity} {unit}
                    </span>
                    <span className={clsx('text-xs font-bold tabular-nums', text)}>{pct}%</span>
                </div>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={clsx('h-full rounded-full transition-all duration-700 ease-out', bar)}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

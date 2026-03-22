'use client';

import { useState, useRef, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

const PRESETS: { label: string; range: () => DateRange }[] = [
  { label: 'Today', range: () => ({ from: new Date(), to: new Date(), label: 'Today' }) },
  { label: 'This Week', range: () => ({ from: subDays(new Date(), 6), to: new Date(), label: 'This Week' }) },
  { label: 'This Month', range: () => ({ from: startOfMonth(new Date()), to: new Date(), label: 'This Month' }) },
  { label: 'Last Month', range: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)), label: 'Last Month' }) },
  { label: 'Last 30 Days', range: () => ({ from: subDays(new Date(), 29), to: new Date(), label: 'Last 30 Days' }) },
  { label: 'Last 90 Days', range: () => ({ from: subDays(new Date(), 89), to: new Date(), label: 'Last 90 Days' }) },
];

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    onChange({ from: new Date(customFrom), to: new Date(customTo), label: 'Custom' });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
      >
        <Calendar className="w-4 h-4" style={{ color: 'var(--muted)' }} />
        <span>{value.label}</span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {format(value.from, 'MMM d')} – {format(value.to, 'MMM d, yyyy')}
        </span>
        <ChevronDown className="w-3 h-3" style={{ color: 'var(--muted)' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-xl border w-72 p-3 animate-fade-in"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Presets</p>
          <div className="grid grid-cols-2 gap-1 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { onChange(p.range()); setOpen(false); }}
                className={clsx(
                  'text-xs px-2 py-1.5 rounded-lg text-left transition-colors',
                  value.label === p.label
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                )}
                style={value.label !== p.label ? { color: 'var(--foreground)' } : {}}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Custom Range</p>
          <div className="flex gap-2 mb-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border"
              style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border"
              style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            />
          </div>
          <button
            onClick={applyCustom}
            className="w-full text-xs py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Apply Custom Range
          </button>
        </div>
      )}
    </div>
  );
}

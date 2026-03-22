'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { Alert, AlertType } from '@/lib/types';
import { useToast } from '@/components/ui/ToastProvider';
import {
  AlertCircle, AlertTriangle, Bell, CheckCircle2,
  ShoppingCart, Info, ChevronDown, X, TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';

// ── Config ────────────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'info' | 'success';

const TYPE_CONFIG: Record<AlertType | string, {
  severity: Severity;
  icon: typeof AlertCircle;
  label: string;
  dot: string;
  bg: string;
  text: string;
  border: string;
}> = {
  OUT_OF_STOCK:    { severity: 'critical', icon: AlertCircle,   label: 'Out of Stock',    dot: 'bg-red-500',     bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400',     border: 'border-l-red-500'     },
  EXPIRY_CRITICAL: { severity: 'critical', icon: AlertCircle,   label: 'Expiry Critical', dot: 'bg-red-500',     bg: 'bg-red-100 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400',     border: 'border-l-red-500'     },
  LOW_STOCK:       { severity: 'warning',  icon: AlertTriangle, label: 'Low Stock',       dot: 'bg-amber-500',   bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-l-amber-500'   },
  EXPIRY_WARNING:  { severity: 'warning',  icon: AlertTriangle, label: 'Expiry Warning',  dot: 'bg-amber-500',   bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-l-amber-500'   },
  AUTO_PO_CREATED: { severity: 'info',     icon: ShoppingCart,  label: 'Auto PO Created', dot: 'bg-blue-500',    bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400',   border: 'border-l-blue-500'    },
  FORECAST_UPDATE: { severity: 'info',     icon: TrendingUp,    label: 'Forecast Updated',dot: 'bg-blue-500',    bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-600 dark:text-blue-400',   border: 'border-l-blue-500'    },
  ORDER_RECEIVED:  { severity: 'success',  icon: CheckCircle2,  label: 'Order Received',  dot: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-500' },
  STOCK_REPLENISHED:{ severity: 'success', icon: CheckCircle2,  label: 'Stock Replenished',dot:'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-500' },
};

const FALLBACK_CONFIG = { severity: 'info' as Severity, icon: Info, label: 'Notification', dot: 'bg-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-l-slate-400' };

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: '🔴 Critical',
  warning:  '🟡 Warning',
  info:     '🔵 Info',
  success:  '🟢 Success',
};

// ── Group helpers ─────────────────────────────────────────────

function getGroup(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d))     return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isThisWeek(d))  return 'This Week';
  return 'Older';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Older'];

function groupAlerts(alerts: Alert[]): Record<string, Alert[]> {
  return alerts.reduce<Record<string, Alert[]>>((acc, a) => {
    const g = getGroup(a.createdAt);
    (acc[g] ??= []).push(a);
    return acc;
  }, {});
}

// ── Swipeable Alert Row ───────────────────────────────────────

function AlertRow({ alert, onRead, onDismiss }: {
  alert: Alert;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[alert.type] ?? FALLBACK_CONFIG;
  const Icon = cfg.icon;
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchMove  = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setOffset(Math.max(dx, -120));
  };
  const onTouchEnd = () => {
    if (offset < -80) {
      setDismissed(true);
      setTimeout(() => onDismiss(alert.id), 300);
    } else {
      setOffset(0);
    }
  };

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl border-l-4 transition-all duration-300',
        cfg.border,
        dismissed && 'opacity-0 -translate-x-full',
        !alert.isRead && 'shadow-sm'
      )}
      style={{
        backgroundColor: 'var(--surface)',
        border: `1px solid var(--border)`,
        borderLeftWidth: 4,
        opacity: alert.isRead ? 0.65 : 1,
      }}
    >
      {/* Swipe delete hint (mobile) */}
      <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500 rounded-r-xl">
        <X className="w-5 h-5 text-white" />
      </div>

      <div
        className="relative flex items-start gap-4 p-4 transition-transform duration-150"
        style={{ transform: `translateX(${offset}px)`, backgroundColor: 'var(--surface)' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
          <Icon className={clsx('w-5 h-5', cfg.text)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                {alert.product.name}
              </span>
              <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.bg, cfg.text)}>
                {cfg.label}
              </span>
              {!alert.isRead && <span className={clsx('w-2 h-2 rounded-full shrink-0', cfg.dot)} />}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!alert.isRead && (
                <button
                  onClick={() => onRead(alert.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                  style={{ color: 'var(--muted)' }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark read
                </button>
              )}
              <button
                onClick={() => { setDismissed(true); setTimeout(() => onDismiss(alert.id), 300); }}
                className="p-1 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                style={{ color: 'var(--muted)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--foreground)' }}>{alert.message}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

const ALL_SEVERITIES: Severity[] = ['critical', 'warning', 'info', 'success'];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('unread');
  const [severityFilter, setSeverityFilter] = useState<Severity[]>([...ALL_SEVERITIES]);
  const { toast } = useToast();

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get(readFilter === 'unread' ? '/alerts?isRead=false' : '/alerts');
      setAlerts(res.data.data);
    } catch {
      toast('Failed to load alerts', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [readFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true } : a));
      toast('Alert marked as read', { type: 'success', duration: 3000 });
    } catch { toast('Failed to mark as read', { type: 'error' }); }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/alerts/read-all');
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      toast('All alerts marked as read', { type: 'success' });
    } catch { toast('Failed to mark all as read', { type: 'error' }); }
  };

  const dismiss = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleSeverity = (s: Severity) =>
    setSeverityFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const filtered = alerts.filter((a) => {
    const cfg = TYPE_CONFIG[a.type] ?? FALLBACK_CONFIG;
    return severityFilter.includes(cfg.severity as Severity);
  });

  const grouped = groupAlerts(filtered);
  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const activeFilters = severityFilter.length < ALL_SEVERITIES.length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        {[0, 1, 2].map((i) => <div key={i} className="h-20 rounded-xl animate-shimmer" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Notification Center
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Read filter */}
          <div
            className="flex rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            {(['unread', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setReadFilter(f)}
                className="px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: readFilter === f ? '#3B82F6' : 'var(--surface)',
                  color: readFilter === f ? 'white' : 'var(--foreground)',
                }}
              >
                {f === 'unread' ? `Unread (${unreadCount})` : `All (${alerts.length})`}
              </button>
            ))}
          </div>

          {/* Severity filter popover */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                activeFilters ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
              style={!activeFilters ? { backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' } : {}}
            >
              <Bell className="w-4 h-4" />
              Filter
              {activeFilters && (
                <span className="ml-1 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {severityFilter.length}
                </span>
              )}
              <ChevronDown className="w-3 h-3" />
            </button>

            {filterOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl shadow-xl border p-2 animate-fade-in"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide px-2 py-1.5" style={{ color: 'var(--muted)' }}>
                  Filter by Type
                </p>
                <div className="h-px my-1" style={{ backgroundColor: 'var(--border)' }} />
                {ALL_SEVERITIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSeverity(s)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <div
                      className={clsx(
                        'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        severityFilter.includes(s)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-slate-300 dark:border-slate-600'
                      )}
                    >
                      {severityFilter.includes(s) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    {SEVERITY_LABELS[s]}
                    <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>
                      {alerts.filter((a) => (TYPE_CONFIG[a.type] ?? FALLBACK_CONFIG).severity === s).length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Severity legend */}
      <div className="flex flex-wrap gap-2">
        {ALL_SEVERITIES.map((s) => (
          <button
            key={s}
            onClick={() => toggleSeverity(s)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all',
              severityFilter.includes(s) ? 'opacity-100' : 'opacity-40'
            )}
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {SEVERITY_LABELS[s]}
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              ({alerts.filter((a) => (TYPE_CONFIG[a.type] ?? FALLBACK_CONFIG).severity === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Grouped notifications */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="font-semibold" style={{ color: 'var(--foreground)' }}>No notifications</p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.filter((g) => grouped[g]?.length).map((group) => (
            <div key={group}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                  {group}
                </h2>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--muted)' }}>
                  {grouped[group].length}
                </span>
              </div>
              <div className="space-y-2">
                {grouped[group].map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    onRead={markAsRead}
                    onDismiss={dismiss}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

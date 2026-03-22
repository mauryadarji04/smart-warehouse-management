'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  actions?: ToastAction[];
}

interface ToastItem extends ToastOptions {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const STYLES: Record<ToastType, { border: string; icon: string; progress: string }> = {
  success: { border: 'border-l-emerald-500', icon: 'text-emerald-500', progress: 'bg-emerald-500' },
  warning: { border: 'border-l-amber-500',   icon: 'text-amber-500',   progress: 'bg-amber-500'   },
  error:   { border: 'border-l-red-500',     icon: 'text-red-500',     progress: 'bg-red-500'     },
  info:    { border: 'border-l-blue-500',    icon: 'text-blue-500',    progress: 'bg-blue-500'    },
};

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const style = STYLES[item.type];
  const Icon = ICONS[item.type];

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(item.id), 300);
  }, [item.id, onDismiss]);

  useEffect(() => {
    const step = 100 / (item.duration / 50);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) { dismiss(); return 0; }
        return p - step;
      });
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [item.duration, dismiss]);

  const pauseProgress = () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  const resumeProgress = () => {
    const step = 100 / (item.duration / 50);
    intervalRef.current = setInterval(() => {
      setProgress((p) => { if (p <= 0) { dismiss(); return 0; } return p - step; });
    }, 50);
  };

  return (
    <div
      onMouseEnter={pauseProgress}
      onMouseLeave={resumeProgress}
      className={clsx(
        'relative w-80 rounded-xl border-l-4 shadow-xl overflow-hidden transition-all duration-300',
        style.border,
        exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0 animate-slide-up'
      )}
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderLeftWidth: 4 }}
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <Icon className={clsx('w-5 h-5 shrink-0 mt-0.5', style.icon)} />
        <p className="flex-1 text-sm font-medium leading-snug" style={{ color: 'var(--foreground)' }}>
          {item.message}
        </p>
        <button onClick={dismiss} className="shrink-0 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
        </button>
      </div>

      {item.actions && item.actions.length > 0 && (
        <div className="flex gap-2 px-4 pb-3">
          {item.actions.map((action) => (
            <button
              key={action.label}
              onClick={() => { action.onClick(); dismiss(); }}
              className={clsx('text-xs font-semibold px-2.5 py-1 rounded-md transition-colors', style.icon,
                'hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="h-0.5 w-full" style={{ backgroundColor: 'var(--border)' }}>
        <div
          className={clsx('h-full transition-none', style.progress)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, options: ToastOptions = {}) => {
    const item: ToastItem = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type: options.type ?? 'info',
      duration: options.duration ?? 5000,
      actions: options.actions,
      createdAt: Date.now(),
    };
    setToasts((prev) => [...prev.slice(-4), item]); // max 5 toasts
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted && createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem item={t} onDismiss={dismiss} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

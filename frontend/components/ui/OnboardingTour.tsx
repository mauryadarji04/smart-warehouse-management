'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOUR_KEY = 'warehouse-tour-done';

interface Step {
  target: string;       // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: Step[] = [
  { target: '[data-tour="logo"]',     title: 'Welcome to Smart Warehouse 👋', description: 'Your all-in-one warehouse management system. Let\'s take a quick tour!', position: 'right' },
  { target: '[data-tour="search"]',   title: 'Global Search',                 description: 'Press Ctrl+K (or ⌘K) to instantly search products, pages, and run commands.', position: 'right' },
  { target: '[data-tour="nav-products"]', title: 'Products Catalog',          description: 'Manage your entire product catalog — add, edit, filter, and export.', position: 'right' },
  { target: '[data-tour="nav-inventory"]', title: 'Inventory Tracking',       description: 'Track stock levels, batches, and expiry dates across all locations.', position: 'right' },
  { target: '[data-tour="nav-analytics"]', title: 'Analytics Dashboard',      description: 'ABC analysis, sales trends, demand forecasting, and KPI charts.', position: 'right' },
  { target: '[data-tour="nav-alerts"]',    title: 'Smart Alerts',             description: 'Get notified about low stock, expiring items, and auto-generated purchase orders.', position: 'right' },
  { target: '[data-tour="theme-toggle"]',  title: 'Theme & Accessibility',    description: 'Switch between light/dark mode and enable high-contrast for accessibility.', position: 'right' },
];

interface Rect { top: number; left: number; width: number; height: number; }

function getRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const PAD = 8;

function getTooltipStyle(rect: Rect, position: Step['position'] = 'right'): React.CSSProperties {
  const TW = 320;
  switch (position) {
    case 'right':  return { top: rect.top + rect.height / 2 - 80, left: rect.left + rect.width + PAD + 12 };
    case 'left':   return { top: rect.top + rect.height / 2 - 80, left: rect.left - TW - PAD - 12 };
    case 'bottom': return { top: rect.top + rect.height + PAD + 12, left: rect.left + rect.width / 2 - TW / 2 };
    case 'top':    return { top: rect.top - 180 - PAD, left: rect.left + rect.width / 2 - TW / 2 };
  }
}

interface Props { forceOpen?: boolean; onClose?: () => void; }

export function OnboardingTour({ forceOpen, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (forceOpen) { setStep(0); setOpen(true); return; }
    if (!localStorage.getItem(TOUR_KEY)) { setOpen(true); }
  }, [forceOpen]);

  const updateRect = useCallback(() => {
    setRect(getRect(STEPS[step]?.target));
  }, [step]);

  useEffect(() => {
    if (!open) return;
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [open, step, updateRect]);

  const close = () => {
    setOpen(false);
    localStorage.setItem(TOUR_KEY, '1');
    onClose?.();
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else close();
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  if (!mounted || !open) return null;

  const current = STEPS[step];
  const tooltipStyle = rect ? getTooltipStyle(rect, current.position) : { top: '50%', left: '50%' };

  return createPortal(
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={close}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - PAD} y={rect.top - PAD}
                width={rect.width + PAD * 2} height={rect.height + PAD * 2}
                rx="10" fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#tour-mask)" />
      </svg>

      {/* Highlight border */}
      {rect && (
        <div
          className="absolute rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - PAD, left: rect.left - PAD,
            width: rect.width + PAD * 2, height: rect.height + PAD * 2,
            boxShadow: '0 0 0 2px #3b82f6, 0 0 0 4px rgba(59,130,246,0.3)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute w-80 rounded-2xl shadow-2xl p-5 pointer-events-auto animate-fade-in"
        style={{ ...tooltipStyle, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn('h-1.5 rounded-full transition-all duration-300', i === step ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-300 dark:bg-slate-600')}
            />
          ))}
          <span className="ml-auto text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {step + 1} / {STEPS.length}
          </span>
        </div>

        <div className="flex items-start gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>{current.title}</h3>
        </div>
        <p className="text-sm mt-1 mb-4 leading-relaxed" style={{ color: 'var(--muted)' }}>{current.description}</p>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={close}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
            style={{ color: 'var(--muted)' }}
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              onClick={next}
              className="flex items-center gap-1 text-xs px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              {step === STEPS.length - 1 ? 'Finish 🎉' : 'Next'} {step < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={close}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white pointer-events-auto transition-colors"
        aria-label="Close tour"
      >
        <X className="w-4 h-4" />
      </button>
    </div>,
    document.body
  );
}

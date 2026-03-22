'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { X, Palette, Type, Sun, Moon, Contrast, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FONT_SIZES = [
  { label: 'Small',  value: '14px', cls: 'text-xs' },
  { label: 'Medium', value: '16px', cls: 'text-sm' },
  { label: 'Large',  value: '18px', cls: 'text-base' },
];

const BRAND_COLORS = [
  { label: 'Blue',    value: '#3B82F6' },
  { label: 'Violet',  value: '#8B5CF6' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Rose',    value: '#F43F5E' },
  { label: 'Amber',   value: '#F59E0B' },
  { label: 'Cyan',    value: '#06B6D4' },
];

const THEME_PRESETS = [
  { label: 'Default',    theme: 'light', color: '#3B82F6', font: '16px' },
  { label: 'Dark Pro',   theme: 'dark',  color: '#8B5CF6', font: '16px' },
  { label: 'Forest',     theme: 'dark',  color: '#10B981', font: '16px' },
  { label: 'Sunset',     theme: 'light', color: '#F43F5E', font: '16px' },
];

const STORAGE_KEY = 'warehouse-theme-prefs';

function loadPrefs() {
  if (typeof window === 'undefined') return { color: '#3B82F6', font: '16px' };
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function applyPrefs(color: string, font: string) {
  const root = document.documentElement;
  root.style.setProperty('--primary', color);
  root.style.setProperty('--primary-foreground', '#ffffff');
  root.style.fontSize = font;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ color, font }));
}

interface Props { open: boolean; onClose: () => void; }

export function ThemeCustomizer({ open, onClose }: Props) {
  const { theme, setTheme } = useTheme();
  const [color, setColor] = useState('#3B82F6');
  const [font, setFont] = useState('16px');

  useEffect(() => {
    const prefs = loadPrefs();
    const c = prefs.color || '#3B82F6';
    const f = prefs.font || '16px';
    setColor(c); setFont(f);
    applyPrefs(c, f);
  }, []);

  const handleColor = (c: string) => { setColor(c); applyPrefs(c, font); };
  const handleFont  = (f: string) => { setFont(f);  applyPrefs(color, f); };

  const applyPreset = (p: typeof THEME_PRESETS[0]) => {
    setTheme(p.theme);
    handleColor(p.color);
    handleFont(p.font);
  };

  const reset = () => {
    setTheme('light');
    handleColor('#3B82F6');
    handleFont('16px');
    document.documentElement.classList.remove('high-contrast');
    localStorage.removeItem('high-contrast');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-500" /> Theme Customizer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Presets */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Presets</p>
            <div className="grid grid-cols-2 gap-2">
              {THEME_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all hover:scale-[1.02] active:scale-95"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-hover)', color: 'var(--foreground)' }}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme mode */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Mode</p>
            <div className="flex gap-2">
              {[
                { value: 'light', icon: Sun,      label: 'Light' },
                { value: 'dark',  icon: Moon,     label: 'Dark' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all',
                    theme === value ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                  style={theme !== value ? { borderColor: 'var(--border)', color: 'var(--foreground)' } : {}}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Brand color */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Brand Color</p>
            <div className="flex items-center gap-2 flex-wrap">
              {BRAND_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleColor(c.value)}
                  title={c.label}
                  aria-label={`Set brand color to ${c.label}`}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all hover:scale-110 active:scale-95',
                    color === c.value && 'ring-2 ring-offset-2 ring-offset-[var(--surface)] scale-110'
                  )}
                  style={{ backgroundColor: c.value, ringColor: c.value }}
                />
              ))}
              {/* Custom color */}
              <label className="w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all hover:scale-110" style={{ borderColor: 'var(--border)' }} title="Custom color">
                <input type="color" value={color} onChange={(e) => handleColor(e.target.value)} className="sr-only" />
                <Palette className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
              </label>
            </div>
          </div>

          {/* Font size */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
              <Type className="w-3.5 h-3.5 inline mr-1" />Font Size
            </p>
            <div className="flex gap-2">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFont(f.value)}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                    font === f.value ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                  )}
                  style={font !== f.value ? { borderColor: 'var(--border)', color: 'var(--foreground)' } : {}}
                >
                  <span className={f.cls}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            style={{ borderColor: 'var(--border)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to defaults
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

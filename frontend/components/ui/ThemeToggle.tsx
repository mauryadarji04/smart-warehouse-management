'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Contrast } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHighContrast(document.documentElement.classList.contains('high-contrast'));
  }, []);

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    document.documentElement.classList.toggle('high-contrast', next);
    localStorage.setItem('high-contrast', String(next));
  };

  if (!mounted) {
    return <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-shimmer" aria-hidden="true" />;
  }

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="focus-ring w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
      >
        {isDark ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
      </button>
      <button
        onClick={toggleHighContrast}
        className={`focus-ring w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          highContrast
            ? 'bg-yellow-400 text-black'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
        aria-pressed={highContrast}
        title="High contrast"
      >
        <Contrast className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

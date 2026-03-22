'use client';

import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { useEffect } from 'react';

function HighContrastInit() {
  useEffect(() => {
    if (localStorage.getItem('high-contrast') === 'true') {
      document.documentElement.classList.add('high-contrast');
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <HighContrastInit />
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

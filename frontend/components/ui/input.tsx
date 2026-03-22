import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'input-focus focus-ring h-10 w-full min-w-0 rounded-lg border px-3 py-2 text-sm transition-colors',
        'bg-transparent placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20',
        className
      )}
      style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface)' } as React.CSSProperties}
      {...props}
    />
  );
}

export { Input };

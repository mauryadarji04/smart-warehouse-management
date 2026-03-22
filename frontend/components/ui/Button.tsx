'use client';

import { ButtonHTMLAttributes, ReactNode, useRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  style,
  onClick,
  disabled,
  ...props
}: ButtonProps) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Ripple
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    }

    onClick?.(e);
  };

  const base = 'ripple-container focus-ring font-semibold rounded-xl transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-target select-none';

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary:   { background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: 'white' },
    secondary: { backgroundColor: 'var(--surface-hover)', color: 'var(--foreground)', border: '1px solid var(--border)' },
    danger:    { backgroundColor: '#EF4444', color: 'white' },
    ghost:     { backgroundColor: 'transparent', color: 'var(--foreground)' },
  };

  return (
    <button
      ref={btnRef}
      className={clsx(base, sizes[size], className)}
      style={{ ...variantStyles[variant], ...style }}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

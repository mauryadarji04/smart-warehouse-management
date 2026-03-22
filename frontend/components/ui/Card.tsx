import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  role?: string;
  'aria-label'?: string;
}

export const Card = ({ children, className, hover = false, ...rest }: CardProps) => {
  return (
    <div
      className={cn('rounded-xl p-6 transition-shadow', hover && 'card-hover cursor-pointer', className)}
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
      {...rest}
    >
      {children}
    </div>
  );
};

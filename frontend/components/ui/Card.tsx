import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div className={clsx('bg-white rounded-xl shadow-sm border border-slate-100 p-6', className)}>
      {children}
    </div>
  );
};

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full' | 'xl' | '2xl';
}

export function Skeleton({ className, rounded = 'lg' }: SkeletonProps) {
  const r = {
    sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg',
    xl: 'rounded-xl', '2xl': 'rounded-2xl', full: 'rounded-full',
  }[rounded];
  return <div className={cn('animate-shimmer', r, className)} aria-hidden="true" />;
}

export function StatCardSkeleton() {
  return (
    <div className="card space-y-3" aria-busy="true" aria-label="Loading stat">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-12 w-12" rounded="xl" />
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4" style={{ width: `${60 + (i % 3) * 20}%` } as React.CSSProperties} />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3" aria-busy="true" aria-label="Loading card">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-7 w-16" rounded="full" />
        <Skeleton className="h-7 w-20" rounded="full" />
      </div>
    </div>
  );
}

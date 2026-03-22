'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const LABELS: Record<string, string> = {
  products:  'Products',
  inventory: 'Inventory',
  reorder:   'Auto-Reorder',
  analytics: 'Analytics',
  alerts:    'Alerts',
  suppliers: 'Suppliers',
  orders:    'Purchase Orders',
  new:       'New',
  edit:      'Edit',
};

export function Breadcrumb() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);

  // Build crumbs: Home + each segment
  const crumbs = [
    { label: 'Home', href: '/' },
    ...segments.map((seg, i) => ({
      label: LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
      href: '/' + segments.slice(0, i + 1).join('/'),
    })),
  ];

  return (
    <nav className="flex items-center gap-1 text-sm mb-6 flex-wrap">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1">
            {i === 0 ? (
              <Link
                href={crumb.href}
                className="flex items-center gap-1 transition-colors hover:text-blue-500"
                style={{ color: 'var(--muted)' }}
              >
                <Home className="w-3.5 h-3.5" />
              </Link>
            ) : isLast ? (
              <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-blue-500"
                style={{ color: 'var(--muted)' }}
              >
                {crumb.label}
              </Link>
            )}
            {!isLast && <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />}
          </span>
        );
      })}
    </nav>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, PackageSearch, PackageMinus, ShoppingCart, Package, X } from 'lucide-react';
import { clsx } from 'clsx';

const actions = [
    { icon: Package, label: 'Add Product', href: '/products/new', color: 'bg-violet-500 hover:bg-violet-600' },
    { icon: ShoppingCart, label: 'Create PO', href: '/orders/new', color: 'bg-blue-500 hover:bg-blue-600' },
    { icon: PackageMinus, label: 'Stock Out', href: '/inventory?action=out', color: 'bg-amber-500 hover:bg-amber-600' },
    { icon: PackageSearch, label: 'Stock In', href: '/inventory?action=in', color: 'bg-emerald-500 hover:bg-emerald-600' },
];

export function FAB() {
    const [open, setOpen] = useState(false);

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col-reverse items-end gap-3">
            {/* Action items */}
            {open &&
                actions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.label}
                            href={action.href}
                            onClick={() => setOpen(false)}
                            className={clsx(
                                'flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-full text-white text-sm font-medium shadow-lg',
                                'transition-all duration-200 hover:shadow-xl hover:scale-105',
                                'animate-slide-up',
                                action.color
                            )}
                            style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {action.label}
                        </Link>
                    );
                })}

            {/* Main FAB button */}
            <button
                onClick={() => setOpen((o) => !o)}
                className={clsx(
                    'w-14 h-14 rounded-full flex items-center justify-center shadow-fab',
                    'transition-all duration-300 hover:scale-110 active:scale-95',
                    open
                        ? 'bg-slate-700 dark:bg-slate-200 rotate-45'
                        : 'bg-blue-600 dark:bg-blue-500 rotate-0',
                    'text-white'
                )}
                aria-label="Quick actions"
            >
                {open ? (
                    <X className="w-6 h-6 dark:text-slate-800" />
                ) : (
                    <Plus className="w-6 h-6" />
                )}
            </button>
        </div>
    );
}

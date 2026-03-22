'use client';

import { ReactNode } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  preview?: ReactNode;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  preview,
  confirmLabel = 'Delete',
  variant = 'danger',
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
              isDanger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
            )}>
              {isDanger
                ? <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                : <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              }
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Preview of what will be deleted */}
        {preview && (
          <div
            className="my-3 p-3 rounded-xl border-l-4 text-sm"
            style={{
              backgroundColor: isDanger ? 'var(--danger-light)' : 'var(--warning-light)',
              borderLeftColor: isDanger ? 'var(--danger)' : 'var(--warning)',
              color: 'var(--foreground)',
            }}
          >
            {preview}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95',
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

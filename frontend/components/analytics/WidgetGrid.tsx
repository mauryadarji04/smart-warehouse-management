'use client';

import { useState, useRef, useCallback } from 'react';
import { GripVertical, X, Maximize2, Minimize2, Eye, EyeOff, Settings } from 'lucide-react';
import { clsx } from 'clsx';

export interface Widget {
  id: string;
  title: string;
  size: 'half' | 'full';
  visible: boolean;
}

interface Props {
  widgets: Widget[];
  onLayoutChange: (widgets: Widget[]) => void;
  renderWidget: (id: string) => React.ReactNode;
}

export function WidgetGrid({ widgets, onLayoutChange, renderWidget }: Props) {
  const [showManager, setShowManager] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOver.current = index; };

  const handleDrop = useCallback(() => {
    if (dragItem.current === null || dragOver.current === null) return;
    const updated = [...widgets];
    const [dragged] = updated.splice(dragItem.current, 1);
    updated.splice(dragOver.current, 0, dragged);
    dragItem.current = null;
    dragOver.current = null;
    onLayoutChange(updated);
  }, [widgets, onLayoutChange]);

  const toggleSize = (id: string) =>
    onLayoutChange(widgets.map((w) => w.id === id ? { ...w, size: w.size === 'half' ? 'full' : 'half' } : w));

  const toggleVisible = (id: string) =>
    onLayoutChange(widgets.map((w) => w.id === id ? { ...w, visible: !w.visible } : w));

  const visible = widgets.filter((w) => w.visible);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowManager(!showManager)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            showManager ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
          )}
          style={!showManager ? { backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' } : {}}
        >
          <Settings className="w-3.5 h-3.5" />
          Customize Layout
        </button>
      </div>

      {showManager && (
        <div
          className="mb-4 p-4 rounded-xl border animate-fade-in"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>
            Show / Hide Widgets
          </p>
          <div className="flex flex-wrap gap-2">
            {widgets.map((w) => (
              <button
                key={w.id}
                onClick={() => toggleVisible(w.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  w.visible ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600'
                )}
                style={!w.visible ? { color: 'var(--muted)' } : {}}
              >
                {w.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {w.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {visible.map((widget, index) => (
          <div
            key={widget.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={clsx(
              'group relative rounded-xl border transition-all duration-200',
              widget.size === 'full' ? 'col-span-2' : 'col-span-1'
            )}
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <GripVertical
                  className="w-4 h-4 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--muted)' }}
                />
                <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{widget.title}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleSize(widget.id)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title={widget.size === 'half' ? 'Expand' : 'Shrink'}
                >
                  {widget.size === 'half'
                    ? <Maximize2 className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                    : <Minimize2 className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                  }
                </button>
                <button
                  onClick={() => toggleVisible(widget.id)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Hide widget"
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                </button>
              </div>
            </div>
            <div className="p-4">
              {renderWidget(widget.id)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

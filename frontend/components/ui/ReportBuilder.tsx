'use client';

import { useState } from 'react';
import { FileText, X, Download, Mail } from 'lucide-react';
import { clsx } from 'clsx';

const METRICS = ['Sales Revenue', 'Units Sold', 'Inventory Value', 'Turnover Ratio', 'Low Stock Count', 'Forecast Accuracy'];
const VIZ_TYPES = ['bar', 'line', 'pie'] as const;
const SCHEDULES = ['None', 'Daily', 'Weekly'] as const;

interface ReportConfig {
  metrics: string[];
  vizType: typeof VIZ_TYPES[number];
  schedule: typeof SCHEDULES[number];
  email: string;
}

interface Props {
  onGenerate: (config: ReportConfig) => void;
}

export function ReportBuilder({ onGenerate }: Props) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<ReportConfig>({
    metrics: ['Sales Revenue'],
    vizType: 'bar',
    schedule: 'None',
    email: '',
  });
  const [saved, setSaved] = useState(false);

  const toggleMetric = (m: string) =>
    setConfig((c) => ({
      ...c,
      metrics: c.metrics.includes(m) ? c.metrics.filter((x) => x !== m) : [...c.metrics, m],
    }));

  const handleGenerate = () => {
    onGenerate(config);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
      >
        <FileText className="w-4 h-4" />
        Report Builder
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Report Builder</h2>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Select Metrics</p>
              <div className="flex flex-wrap gap-2">
                {METRICS.map((m) => (
                  <button
                    key={m}
                    onClick={() => toggleMetric(m)}
                    className={clsx(
                      'text-xs px-3 py-1.5 rounded-full border transition-colors',
                      config.metrics.includes(m)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 dark:border-slate-600 hover:border-blue-400'
                    )}
                    style={!config.metrics.includes(m) ? { color: 'var(--foreground)' } : {}}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Visualization */}
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Visualization Type</p>
              <div className="flex gap-2">
                {VIZ_TYPES.map((v) => (
                  <button
                    key={v}
                    onClick={() => setConfig((c) => ({ ...c, vizType: v }))}
                    className={clsx(
                      'flex-1 py-2 rounded-lg text-sm font-medium capitalize border transition-colors',
                      config.vizType === v ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 dark:border-slate-600'
                    )}
                    style={config.vizType !== v ? { color: 'var(--foreground)' } : {}}
                  >
                    {v} chart
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Schedule Email Report</p>
              <div className="flex gap-2 mb-2">
                {SCHEDULES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setConfig((c) => ({ ...c, schedule: s }))}
                    className={clsx(
                      'flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                      config.schedule === s ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 dark:border-slate-600'
                    )}
                    style={config.schedule !== s ? { color: 'var(--foreground)' } : {}}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {config.schedule !== 'None' && (
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={config.email}
                    onChange={(e) => setConfig((c) => ({ ...c, email: e.target.value }))}
                    className="flex-1 text-sm px-3 py-1.5 rounded-lg border"
                    style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={config.metrics.length === 0}
              className={clsx(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
                config.metrics.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Download className="w-4 h-4" />
              {saved ? '✓ Report Generated!' : 'Generate Report'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

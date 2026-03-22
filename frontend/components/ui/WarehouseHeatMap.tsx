'use client';

import { clsx } from 'clsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';

export interface WarehouseZone {
    id: string;
    label: string;
    occupancy: number; // 0–100 %
}

interface WarehouseHeatMapProps {
    zones: WarehouseZone[];
}

function getHeatColor(pct: number): string {
    if (pct >= 90) return 'bg-red-600 text-white';
    if (pct >= 75) return 'bg-red-400 text-white';
    if (pct >= 60) return 'bg-amber-400 text-white';
    if (pct >= 40) return 'bg-amber-200 text-amber-900';
    if (pct >= 20) return 'bg-emerald-200 text-emerald-900';
    return 'bg-emerald-100 text-emerald-800';
}

export function WarehouseHeatMap({ zones }: WarehouseHeatMapProps) {
    return (
        <TooltipProvider delayDuration={100}>
            <div className="grid grid-cols-4 gap-2">
                {zones.map((zone) => (
                    <Tooltip key={zone.id}>
                        <TooltipTrigger asChild>
                            <div
                                className={clsx(
                                    'rounded-lg p-3 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md',
                                    getHeatColor(zone.occupancy)
                                )}
                            >
                                <p className="text-xs font-bold truncate">{zone.label}</p>
                                <p className="text-sm font-extrabold tabular-nums mt-1">{zone.occupancy}%</p>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            className="bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg border-0"
                        >
                            {zone.label}: {zone.occupancy}% occupied
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
                {[
                    { color: 'bg-emerald-100', label: '0–20% Empty' },
                    { color: 'bg-emerald-200', label: '20–40% Low' },
                    { color: 'bg-amber-200', label: '40–60% Med' },
                    { color: 'bg-amber-400', label: '60–75% High' },
                    { color: 'bg-red-400', label: '75–90% Full' },
                    { color: 'bg-red-600', label: '90%+ Critical' },
                ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <div className={clsx('w-3 h-3 rounded-sm', item.color)} />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
                    </div>
                ))}
            </div>
        </TooltipProvider>
    );
}

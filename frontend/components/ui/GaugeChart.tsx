'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Cell } from 'recharts';
import { clsx } from 'clsx';

interface GaugeChartProps {
    value: number; // 0–100
    label?: string;
    size?: number;
}

function getGaugeColor(v: number) {
    if (v >= 80) return '#10B981';
    if (v >= 60) return '#F59E0B';
    return '#EF4444';
}

function getRating(v: number) {
    if (v >= 80) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400' };
    if (v >= 60) return { label: 'Fair', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Poor', color: 'text-red-500 dark:text-red-400' };
}

export function GaugeChart({ value, label = 'Accuracy', size = 180 }: GaugeChartProps) {
    const color = getGaugeColor(value);
    const { label: rating, color: ratingColor } = getRating(value);
    const data = [{ value }];

    return (
        <div className="flex flex-col items-center">
            <div style={{ width: size, height: size / 1.4 }} className="relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%"
                        cy="80%"
                        innerRadius="60%"
                        outerRadius="100%"
                        startAngle={180}
                        endAngle={0}
                        data={data}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        {/* Background track */}
                        <RadialBar
                            background={{ fill: 'rgb(241 245 249)' }}
                            dataKey="value"
                            cornerRadius={6}
                        >
                            <Cell fill={color} />
                        </RadialBar>
                    </RadialBarChart>
                </ResponsiveContainer>

                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                    <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
                        {value}%
                    </span>
                </div>
            </div>

            <div className="mt-2 text-center">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <p className={clsx('text-xs font-bold mt-0.5', ratingColor)}>{rating}</p>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { useCountUp } from '@/components/ui/CountUp';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    sparkData?: { v: number }[];
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
    subtitle?: string;
    loading?: boolean;
}

const colorMap = {
    blue: {
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconText: 'text-blue-600 dark:text-blue-400',
        line: '#3B82F6',
        badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
    },
    green: {
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        line: '#10B981',
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    },
    red: {
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconText: 'text-red-600 dark:text-red-400',
        line: '#EF4444',
        badge: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    },
    yellow: {
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconText: 'text-amber-600 dark:text-amber-400',
        line: '#F59E0B',
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    },
    gray: {
        iconBg: 'bg-slate-100 dark:bg-slate-800',
        iconText: 'text-slate-500 dark:text-slate-400',
        line: '#64748B',
        badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    },
};

export function StatCard({
    title,
    value,
    icon: Icon,
    trend = 'neutral',
    trendValue,
    sparkData = [],
    color = 'blue',
    subtitle,
    loading,
}: StatCardProps) {
    const colors = colorMap[color];
    const [animating, setAnimating] = useState(false);
    const prevValue = useRef(value);

    useEffect(() => {
        if (prevValue.current !== value && !loading) {
            setAnimating(true);
            const t = setTimeout(() => setAnimating(false), 700);
            prevValue.current = value;
            return () => clearTimeout(t);
        }
    }, [value, loading]);

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor =
        trend === 'up'
            ? 'text-emerald-600 dark:text-emerald-400'
            : trend === 'down'
                ? 'text-red-500 dark:text-red-400'
                : 'text-slate-400';

    return (
        <div
            className={clsx(
                'card relative overflow-hidden transition-all duration-300',
                animating && 'animate-pulse-once ring-2 ring-blue-400/40'
            )}
        >
            {/* Top row */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                        {title}
                    </p>
                    <div className="flex items-end gap-2">
                        <span
                              className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tabular-nums"
                              aria-label={`${title}: ${value}`}
                            >
                            {loading ? (
                                <span className="inline-block w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-shimmer" aria-hidden="true" />
                            ) : typeof value === 'number' ? (
                                <AnimatedNumber value={value} />
                            ) : (
                                value
                            )}
                        </span>
                        {trendValue && !loading && (
                            <span className={clsx('flex items-center gap-0.5 text-xs font-semibold mb-1', trendColor)}>
                                <TrendIcon className="w-3 h-3" />
                                {trendValue}
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>
                    )}
                </div>

                <div className={clsx('p-3 rounded-xl shrink-0 ml-3', colors.iconBg)}>
                    <Icon className={clsx('w-6 h-6', colors.iconText)} />
                </div>
            </div>

            {/* Sparkline */}
            {sparkData.length > 0 && (
                <div className="mt-2 h-12 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparkData}>
                            <Line
                                type="monotone"
                                dataKey="v"
                                stroke={colors.line}
                                strokeWidth={2}
                                dot={false}
                                animationDuration={800}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(15,23,42,0.9)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    color: '#e2e8f0',
                                    padding: '4px 8px',
                                }}
                                itemStyle={{ color: '#e2e8f0' }}
                                formatter={(v: number) => [v, title]}
                                labelFormatter={() => ''}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

function AnimatedNumber({ value }: { value: number }) {
    const count = useCountUp(value);
    return <>{count.toLocaleString()}</>;
}

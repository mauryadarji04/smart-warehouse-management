'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
const PIECES = 18;

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  angle: number;
}

interface SuccessConfettiProps {
  show: boolean;
  onDone?: () => void;
  message?: string;
  className?: string;
}

export function SuccessConfetti({ show, onDone, message = 'Done!', className }: SuccessConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    setParticles(
      Array.from({ length: PIECES }, (_, i) => ({
        id: i,
        x: 30 + Math.random() * 40,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
        angle: (360 / PIECES) * i + Math.random() * 20,
      }))
    );
    const t = setTimeout(() => {
      setVisible(false);
      setParticles([]);
      onDone?.();
    }, 1800);
    return () => clearTimeout(t);
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className={cn('fixed inset-0 z-[100] flex items-center justify-center pointer-events-none', className)}
      aria-live="polite"
      aria-label={message}
    >
      <div className="relative flex flex-col items-center gap-3">
        {/* Confetti particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute animate-confetti"
            style={{
              left: `${p.x}%`,
              top: '50%',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              transform: `rotate(${p.angle}deg)`,
              animationDelay: `${Math.random() * 0.3}s`,
            }}
          />
        ))}

        {/* Checkmark circle */}
        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl animate-bounce-in">
          <svg viewBox="0 0 50 50" className="w-10 h-10" fill="none">
            <path
              d="M12 25 L22 35 L38 16"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="50"
              strokeDashoffset="50"
              className="animate-checkmark"
            />
          </svg>
        </div>

        <p className="text-base font-bold text-white bg-slate-900/80 px-4 py-1.5 rounded-full animate-fade-in">
          {message}
        </p>
      </div>
    </div>
  );
}

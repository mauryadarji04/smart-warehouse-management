'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Keyboard, X, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [scanned, setScanned] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start camera
  useEffect(() => {
    if (mode !== 'camera') return;
    let active = true;
    setScanning(true);
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setScanning(false);
      })
      .catch(() => {
        if (!active) return;
        setCameraError(true);
        setMode('manual');
        setScanning(false);
      });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [mode]);

  // Focus manual input
  useEffect(() => {
    if (mode === 'manual') setTimeout(() => inputRef.current?.focus(), 100);
  }, [mode]);

  const playBeep = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  };

  const handleScan = (code: string) => {
    if (!code.trim()) return;
    playBeep();
    if (navigator.vibrate) navigator.vibrate(100);
    setScanned(code.trim());
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setTimeout(() => { onScan(code.trim()); }, 800);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) handleScan(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
        style={{ backgroundColor: 'var(--surface)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Barcode Scanner</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          {(['camera', 'manual'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={cn('flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors', {
                'text-blue-600 border-b-2 border-blue-600': mode === m,
                'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300': mode !== m,
              })}>
              {m === 'camera' ? <Camera className="w-4 h-4" /> : <Keyboard className="w-4 h-4" />}
              {m === 'camera' ? 'Camera' : 'Manual Entry'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Success state */}
          {scanned ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-pulse-once">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">Scanned!</p>
              <p className="font-mono text-sm px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800" style={{ color: 'var(--foreground)' }}>
                {scanned}
              </p>
            </div>
          ) : mode === 'camera' ? (
            <div className="space-y-3">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
                    <CameraOff className="w-8 h-8" />
                    <p className="text-xs">Camera unavailable</p>
                  </div>
                )}
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {/* Scan frame overlay */}
                {!cameraError && !scanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-32 border-2 border-blue-400 rounded-lg relative">
                      <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr" />
                      <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl" />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br" />
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-400/60 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
                Point camera at a barcode or QR code
              </p>
              {/* Simulate scan for demo */}
              <button
                onClick={() => handleScan('SKU-' + Math.random().toString(36).slice(2, 8).toUpperCase())}
                className="w-full py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                Simulate scan (demo)
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Enter barcode or SKU manually</p>
              <input
                ref={inputRef}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. SKU-001 or barcode number"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                Confirm Code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

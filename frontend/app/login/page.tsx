'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, ShieldCheck, Warehouse } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

type Mode = 'login' | 'register' | 'forgot' | 'otp' | 'reset';

// ── Password strength ─────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Too short', color: 'bg-slate-300' },
    { label: 'Weak',      color: 'bg-red-500' },
    { label: 'Fair',      color: 'bg-amber-500' },
    { label: 'Good',      color: 'bg-blue-500' },
    { label: 'Strong',    color: 'bg-emerald-500' },
  ];
  return { score, ...levels[score] };
}

// ── Field wrapper ─────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</label>
      {children}
    </div>
  );
}

function PasswordInput({ name, value, onChange, placeholder = '••••••••' }: {
  name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
      <input
        type={show ? 'text' : 'password'}
        name={name} value={value} onChange={onChange} placeholder={placeholder} required
        className="input-focus focus-ring w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}
      />
      <button
        type="button" onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4 h-4" style={{ color: 'var(--muted)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--muted)' }} />}
      </button>
    </div>
  );
}

// ── Social button ─────────────────────────────────────────────
function SocialBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={() => alert('Social login not implemented yet')}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
      style={{ borderColor: 'var(--border)', color: 'var(--foreground)', backgroundColor: 'var(--surface)' }}
    >
      {icon} {label}
    </button>
  );
}

// ── Branding panel ────────────────────────────────────────────
function BrandPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.03]" />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
          <Warehouse className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg">Smart Warehouse</span>
      </div>

      {/* Center content */}
      <div className="relative z-10 space-y-6">
        <div className="space-y-3">
          <h2 className="text-4xl font-extrabold leading-tight">
            Manage your<br />warehouse smarter
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            Real-time inventory tracking, automated reordering, and AI-powered demand forecasting.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2">
          {['EOQ Auto-Reorder', 'Demand Forecasting', 'Live Alerts', 'Analytics'].map((f) => (
            <span key={f} className="px-3 py-1 rounded-full bg-white/15 text-sm font-medium backdrop-blur">
              {f}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
          {[
            { value: '99.9%', label: 'Uptime' },
            { value: '<1s',   label: 'Response' },
            { value: 'SOC2',  label: 'Compliant' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-blue-300 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-blue-300 text-xs relative z-10">
        © {new Date().getFullYear()} Smart Warehouse. All rights reserved.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    otp: '', newPassword: '', confirmNewPassword: '',
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        const { token, user } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (rememberMe) localStorage.setItem('remember-email', formData.email);
        window.dispatchEvent(new Event('user-login'));
        router.push('/');

      } else if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
        if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        const res = await api.post('/auth/register', { name: formData.name, email: formData.email, password: formData.password });
        const { token, user } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user-login'));
        router.push('/');

      } else if (mode === 'forgot') {
        await api.post('/auth/forgot-password', { email: formData.email });
        setSuccess('OTP sent to your email. Check your inbox.');
        setMode('otp');

      } else if (mode === 'otp') {
        if (!formData.otp || formData.otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
        setMode('reset');

      } else if (mode === 'reset') {
        if (formData.newPassword !== formData.confirmNewPassword) { setError('Passwords do not match'); return; }
        if (formData.newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
        await api.post('/auth/reset-password', { email: formData.email, otp: formData.otp, newPassword: formData.newPassword });
        setSuccess('Password reset! Please sign in.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => { setMode(m); setError(''); setSuccess(''); };

  const strength = getStrength(formData.password);
  const showStrength = (mode === 'register' || mode === 'reset') && formData.password.length > 0;

  const titles: Record<Mode, { heading: string; sub: string }> = {
    login:    { heading: 'Welcome back',        sub: 'Sign in to your account to continue' },
    register: { heading: 'Create account',      sub: 'Start managing your warehouse today' },
    forgot:   { heading: 'Forgot password?',    sub: 'Enter your email to receive an OTP' },
    otp:      { heading: 'Check your email',    sub: 'Enter the 6-digit code we sent you' },
    reset:    { heading: 'Set new password',    sub: 'Choose a strong password' },
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ backgroundColor: 'var(--background)' }}>
      <BrandPanel />

      {/* Right: Form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md mx-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold" style={{ color: 'var(--foreground)' }}>Smart Warehouse</span>
          </div>

          {/* Back button for sub-modes */}
          {(mode === 'forgot' || mode === 'otp' || mode === 'reset') && (
            <button
              onClick={() => switchMode('login')}
              className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-blue-600"
              style={{ color: 'var(--muted)' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to sign in
            </button>
          )}

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold" style={{ color: 'var(--foreground)' }}>
              {titles[mode].heading}
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--muted)' }}>{titles[mode].sub}</p>
          </div>

          {/* Social login (login + register only) */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <div className="flex gap-3 mb-6">
                <SocialBtn
                  label="Google"
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  }
                />
                <SocialBtn
                  label="Microsoft"
                  icon={
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#F25022" d="M1 1h10v10H1z"/>
                      <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                      <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                      <path fill="#FFB900" d="M13 13h10v10H13z"/>
                    </svg>
                  }
                />
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>or continue with email</span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
              </div>
            </>
          )}

          {/* Alerts */}
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm animate-fade-in">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm animate-fade-in">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Field label="Full Name">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <input
                    type="text" name="name" required value={formData.name} onChange={handleChange}
                    placeholder="John Doe"
                    className="input-focus focus-ring w-full pl-10 py-2.5 rounded-xl border text-sm"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}
                  />
                </div>
              </Field>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <Field label="Email Address">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <input
                    type="email" name="email" required value={formData.email} onChange={handleChange}
                    placeholder="you@example.com"
                    className="input-focus focus-ring w-full pl-10 py-2.5 rounded-xl border text-sm"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}
                  />
                </div>
              </Field>
            )}

            {(mode === 'login' || mode === 'register') && (
              <Field label="Password">
                <PasswordInput name="password" value={formData.password} onChange={handleChange} />
                {showStrength && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={cn('h-1 flex-1 rounded-full transition-all duration-300', i < strength.score ? strength.color : 'bg-slate-200 dark:bg-slate-700')}
                        />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Strength: <span className={cn('font-semibold', {
                        'text-red-500': strength.score === 1,
                        'text-amber-500': strength.score === 2,
                        'text-blue-500': strength.score === 3,
                        'text-emerald-500': strength.score === 4,
                      })}>{strength.label}</span>
                    </p>
                  </div>
                )}
              </Field>
            )}

            {mode === 'register' && (
              <Field label="Confirm Password">
                <PasswordInput name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
              </Field>
            )}

            {mode === 'otp' && (
              <Field label="6-Digit OTP">
                <input
                  type="text" name="otp" required maxLength={6} value={formData.otp} onChange={handleChange}
                  placeholder="000000"
                  className="input-focus focus-ring w-full py-3 rounded-xl border text-center text-2xl tracking-[0.5em] font-bold"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Valid for 10 minutes. Check your spam folder.</p>
              </Field>
            )}

            {mode === 'reset' && (
              <>
                <Field label="New Password">
                  <PasswordInput name="newPassword" value={formData.newPassword} onChange={handleChange} />
                  {formData.newPassword.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[0, 1, 2, 3].map((i) => {
                        const s = getStrength(formData.newPassword);
                        return <div key={i} className={cn('h-1 flex-1 rounded-full transition-all', i < s.score ? s.color : 'bg-slate-200 dark:bg-slate-700')} />;
                      })}
                    </div>
                  )}
                </Field>
                <Field label="Confirm New Password">
                  <PasswordInput name="confirmNewPassword" value={formData.confirmNewPassword} onChange={handleChange} />
                </Field>
              </>
            )}

            {/* Remember me + Forgot (login only) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(!!v)}
                    aria-label="Remember me"
                  />
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>Remember me</span>
                </label>
                <button
                  type="button" onClick={() => switchMode('forgot')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Processing…
                </span>
              ) : (
                { login: 'Sign In', register: 'Create Account', forgot: 'Send OTP', otp: 'Verify OTP', reset: 'Reset Password' }[mode]
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 text-center text-sm">
            {mode === 'login' && (
              <p style={{ color: 'var(--muted)' }}>
                Don't have an account?{' '}
                <button onClick={() => switchMode('register')} className="font-semibold text-blue-600 hover:text-blue-700">
                  Sign up free
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p style={{ color: 'var(--muted)' }}>
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="font-semibold text-blue-600 hover:text-blue-700">
                  Sign in
                </button>
              </p>
            )}
          </div>

          <p className="mt-8 text-xs text-center" style={{ color: 'var(--muted)' }}>
            🔒 Secured with JWT & bcrypt encryption
          </p>
        </div>
      </div>
    </div>
  );
}

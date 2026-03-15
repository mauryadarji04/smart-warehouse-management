'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

type Mode = 'login' | 'register' | 'forgot' | 'otp' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', otp: '', newPassword: '', confirmNewPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        const { token, user } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user-login'));
        router.push('/');

      } else if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
        if (formData.password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
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
        if (!formData.otp || formData.otp.length !== 6) { setError('Enter the 6-digit OTP'); setLoading(false); return; }
        setMode('reset');

      } else if (mode === 'reset') {
        if (formData.newPassword !== formData.confirmNewPassword) { setError('Passwords do not match'); setLoading(false); return; }
        if (formData.newPassword.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        await api.post('/auth/reset-password', { email: formData.email, otp: formData.otp, newPassword: formData.newPassword });
        setSuccess('Password reset successfully! Please login.');
        setFormData({ name: '', email: '', password: '', confirmPassword: '', otp: '', newPassword: '', confirmNewPassword: '' });
        setMode('login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => { setMode(m); setError(''); setSuccess(''); };

  const titles: Record<Mode, string> = {
    login: 'Sign in to your account',
    register: 'Create a new account',
    forgot: 'Forgot your password?',
    otp: 'Enter OTP',
    reset: 'Set new password',
  };

  const buttonLabels: Record<Mode, string> = {
    login: 'Sign In',
    register: 'Create Account',
    forgot: 'Send OTP',
    otp: 'Verify OTP',
    reset: 'Reset Password',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📦</div>
          <h1 className="text-2xl font-bold text-slate-800">Smart Warehouse</h1>
          <p className="text-slate-500 mt-1">{titles[mode]}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register: Name */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe" />
            </div>
          )}

          {/* Email */}
          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com" />
            </div>
          )}

          {/* Login/Register: Password */}
          {(mode === 'login' || mode === 'register') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input type="password" name="password" required value={formData.password} onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••" />
            </div>
          )}

          {/* Register: Confirm Password */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••" />
            </div>
          )}

          {/* OTP Step */}
          {mode === 'otp' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">6-Digit OTP</label>
              <input type="text" name="otp" required maxLength={6} value={formData.otp} onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-bold"
                placeholder="000000" />
              <p className="text-xs text-slate-500 mt-1">Check your email for the OTP. Valid for 10 minutes.</p>
            </div>
          )}

          {/* Reset Step */}
          {mode === 'reset' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                <input type="password" name="newPassword" required value={formData.newPassword} onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                <input type="password" name="confirmNewPassword" required value={formData.confirmNewPassword} onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••" />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processing...' : buttonLabels[mode]}
          </Button>
        </form>

        {/* Footer links */}
        <div className="mt-6 text-center space-y-2">
          {mode === 'login' && (
            <>
              <button onClick={() => switchMode('forgot')} className="block w-full text-sm text-slate-500 hover:text-blue-600">
                Forgot password?
              </button>
              <button onClick={() => switchMode('register')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Don't have an account? Sign up
              </button>
            </>
          )}
          {mode === 'register' && (
            <button onClick={() => switchMode('login')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Already have an account? Sign in
            </button>
          )}
          {(mode === 'forgot' || mode === 'otp' || mode === 'reset') && (
            <button onClick={() => switchMode('login')} className="text-sm text-slate-500 hover:text-blue-600">
              ← Back to login
            </button>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">🔒 Secure authentication with JWT & bcrypt</p>
        </div>
      </Card>
    </div>
  );
}

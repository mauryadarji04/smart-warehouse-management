'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User, Mail, Shield, Save, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';
const inputStyle = {
  backgroundColor: 'var(--surface-hover)',
  borderColor: 'var(--border)',
  color: 'var(--foreground)',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setForm({ name: u.name, email: u.email, password: '' });
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      const res = await api.put('/auth/profile', payload);
      const updated = res.data.data;
      const newUser = { ...user, name: updated.name, email: updated.email };
      localStorage.setItem('user', JSON.stringify(newUser));
      window.dispatchEvent(new Event('user-login'));
      setUser(newUser);
      setForm((f) => ({ ...f, password: '' }));
      toast('Profile updated successfully', { type: 'success' });
    } catch (err: any) {
      toast(err.response?.data?.message || 'Failed to update profile', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Profile</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Manage your account details and password
        </p>
      </div>

      {/* Avatar card */}
      <div
        className="flex items-center gap-4 p-5 rounded-2xl border"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{user?.name}</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{user?.email}</p>
          <span
            className={cn(
              'mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold',
              user?.role === 'ADMIN'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            )}
          >
            {user?.role}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-6 rounded-2xl border"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <Shield className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
            Account Details
          </span>
        </div>

        <Field label="Full Name">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={cn(inputCls, 'pl-10')}
              style={inputStyle}
            />
          </div>
        </Field>

        <Field label="Email Address">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={cn(inputCls, 'pl-10')}
              style={inputStyle}
            />
          </div>
        </Field>

        <Field label="New Password (leave blank to keep current)">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
            <input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className={cn(inputCls, 'pl-10 pr-10')}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--muted)' }}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

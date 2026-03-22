'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Package,
  Warehouse,
  AlertCircle,
  BarChart3,
  Users,
  ShoppingCart,
  Repeat,
  TrendingUp,
  LogOut,
  User,
  Mail,
  Shield,
  X,
  Search,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { OnboardingTour } from '@/components/ui/OnboardingTour';
import { ThemeCustomizer } from '@/components/ui/ThemeCustomizer';
import { Palette, HelpCircle } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/reorder', label: 'Auto-Reorder', icon: Repeat },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/alerts', label: 'Alerts', icon: AlertCircle, badge: true },
  { href: '/suppliers', label: 'Suppliers', icon: Users },
  { href: '/orders', label: 'Purchase Orders', icon: ShoppingCart },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const loadUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    else setUser(null);
  };

  const fetchAlertCount = useCallback(async () => {
    try {
      const res = await api.get('/alerts/stats');
      setAlertCount(res.data?.data?.unread ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadUser();
    fetchAlertCount();

    const interval = setInterval(fetchAlertCount, 60_000);

    window.addEventListener('storage', loadUser);
    window.addEventListener('user-login', loadUser);

    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('user-login', loadUser);
      window.removeEventListener('keydown', onKey);
    };
  }, [fetchAlertCount]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowProfile(false);
    router.push('/login');
  };

  const goToProfile = () => {
    setShowProfile(false);
    router.push('/profile');
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <aside
        className="w-64 fixed h-full flex flex-col border-r transition-colors duration-300"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="p-5 flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8" data-tour="logo">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-fab">
                W
              </div>
              <div>
                <h1 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                  Smart Warehouse
                </h1>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  v8 — Enhanced
                </p>
              </div>
            </div>
            <div data-tour="theme-toggle">
              <ThemeToggle />
            </div>
          </div>

          {/* Search trigger */}
          <button
            data-tour="search"
            onClick={() => setCmdOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 mb-4 rounded-lg border text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">Search…</span>
            <kbd
              className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono border"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Nav */}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const showBadge = item.badge && alertCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={`nav-${item.href.replace('/', '') || 'dashboard'}`}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                  style={
                    !isActive
                      ? { color: 'var(--foreground)' }
                      : {}
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                      {alertCount > 99 ? '99+' : alertCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Settings row */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <button
            onClick={() => setThemeOpen(true)}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)', backgroundColor: 'var(--surface-hover)' }}
            title="Customize theme"
          >
            <Palette className="w-3.5 h-3.5" /> Theme
          </button>
          <button
            onClick={() => setTourOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)', backgroundColor: 'var(--surface-hover)' }}
            title="Replay onboarding tour"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setShowProfile(true)}
              className="w-full flex items-center gap-3 mb-3 rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                  {user.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {user.role}
                </p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb />
          {children}
        </div>
      </main>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <OnboardingTour forceOpen={tourOpen} onClose={() => setTourOpen(false)} />
      <ThemeCustomizer open={themeOpen} onClose={() => setThemeOpen(false)} />

      {/* Profile Modal */}
      {showProfile && user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                Profile
              </h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-3">
                <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                {user.name}
              </h3>
              <span
                className={clsx(
                  'mt-1 px-3 py-0.5 rounded-full text-xs font-semibold',
                  user.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                )}
              >
                {user.role}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { icon: Mail, label: 'Email', value: user.email },
                { icon: Shield, label: 'Role', value: user.role },
                { icon: User, label: 'User ID', value: user.id },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--surface-hover)' }}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {label}
                    </p>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={goToProfile}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 text-sm font-medium rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              style={{ color: 'var(--foreground)', border: '1px solid var(--border)' }}
            >
              <User className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

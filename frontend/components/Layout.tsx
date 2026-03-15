'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, Warehouse, AlertCircle, BarChart3, Users, ShoppingCart, Repeat, TrendingUp, LogOut, User, Mail, Shield, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/reorder', label: 'Auto-Reorder', icon: Repeat },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/alerts', label: 'Alerts', icon: AlertCircle },
  { href: '/suppliers', label: 'Suppliers', icon: Users },
  { href: '/orders', label: 'Purchase Orders', icon: ShoppingCart },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);

  const loadUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    else setUser(null);
  };

  useEffect(() => {
    loadUser();

    // Listen for storage changes (triggered after login)
    window.addEventListener('storage', loadUser);

    // Also listen for custom login event (same-tab login)
    window.addEventListener('user-login', loadUser);

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('user-login', loadUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowProfile(false);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 fixed h-full flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="text-3xl">📦</div>
            <div>
              <h1 className="font-bold text-lg text-slate-800">Smart Warehouse</h1>
              <p className="text-xs text-slate-500">Phase 7 — Auth</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Section */}
        {user && (
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={() => setShowProfile(true)}
              className="w-full flex items-center gap-3 mb-3 hover:bg-slate-50 rounded-lg p-2 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium text-sm text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">{children}</main>

      {/* Profile Modal */}
      {showProfile && user && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Profile</h2>
              <button onClick={() => setShowProfile(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
              <span className={clsx(
                'mt-1 px-3 py-0.5 rounded-full text-xs font-semibold',
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
              )}>
                {user.role}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-800">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="text-sm font-medium text-slate-800">{user.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">User ID</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{user.id}</p>
                </div>
              </div>
            </div>

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

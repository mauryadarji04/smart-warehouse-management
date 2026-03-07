'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { Package, AlertCircle, TrendingDown, Warehouse } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    totalInventory: 0,
    unreadAlerts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, lowStock, alerts] = await Promise.all([
          api.get('/products'),
          api.get('/inventory/low-stock'),
          api.get('/alerts/stats'),
        ]);

        const totalInventory = products.data.data.reduce(
          (sum: number, p: any) => sum + (p.totalQuantity || 0),
          0
        );

        setStats({
          totalProducts: products.data.data.length,
          lowStock: lowStock.data.data.length,
          totalInventory,
          unreadAlerts: alerts.data.data.unread,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'blue',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStock,
      icon: TrendingDown,
      color: stats.lowStock > 0 ? 'red' : 'green',
    },
    {
      title: 'Total Inventory',
      value: stats.totalInventory,
      icon: Warehouse,
      color: 'green',
    },
    {
      title: 'Unread Alerts',
      value: stats.unreadAlerts,
      icon: AlertCircle,
      color: stats.unreadAlerts > 0 ? 'yellow' : 'gray',
    },
  ];

  if (loading) {
    return <div className="text-center py-20">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Inventory overview at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600">Stock Coverage</span>
            <Badge variant={stats.lowStock === 0 ? 'green' : 'yellow'}>
              {stats.lowStock === 0 ? 'Healthy' : `${stats.lowStock} items low`}
            </Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-600">Alert Status</span>
            <Badge variant={stats.unreadAlerts === 0 ? 'green' : 'red'}>
              {stats.unreadAlerts} unread
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

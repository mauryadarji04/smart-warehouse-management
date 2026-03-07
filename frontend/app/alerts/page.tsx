'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { Alert } from '@/lib/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const url = filter === 'unread' ? '/alerts?isRead=false' : '/alerts';
      const res = await api.get(url);
      setAlerts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/alerts/read-all');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'yellow';
      case 'OUT_OF_STOCK':
        return 'red';
      case 'EXPIRY_WARNING':
        return 'yellow';
      case 'EXPIRY_CRITICAL':
        return 'red';
      case 'AUTO_PO_CREATED':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getAlertIcon = (type: string) => {
    return <AlertCircle className="w-5 h-5" />;
  };

  if (loading) return <div className="text-center py-20">Loading alerts...</div>;

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Alerts</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount} unread {unreadCount === 1 ? 'alert' : 'alerts'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant={filter === 'unread' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
          <Button variant={filter === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('all')}>
            All ({alerts.length})
          </Button>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCircle2 className="w-4 h-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card
            key={alert.id}
            className={`transition-all ${alert.isRead ? 'opacity-60' : 'border-l-4 border-l-blue-500'}`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg bg-${getAlertColor(alert.type)}-100`}>
                {getAlertIcon(alert.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{alert.product.name}</h3>
                      <Badge variant={getAlertColor(alert.type)}>{alert.type.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-slate-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {!alert.isRead && (
                    <Button size="sm" variant="ghost" onClick={() => markAsRead(alert.id)}>
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {alerts.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-600">No {filter === 'unread' ? 'unread ' : ''}alerts</p>
              <p className="text-sm text-slate-400 mt-1">You're all caught up!</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

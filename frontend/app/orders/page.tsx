'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { PurchaseOrder, POStatus } from '@/lib/types';
import {
  Plus, Package, Clock, TrendingUp, CheckCircle2,
  Truck, FileText, AlertCircle, Calendar, DollarSign,
} from 'lucide-react';
import Link from 'next/link';

const STATUSES: POStatus[] = ['DRAFT', 'ORDERED', 'IN_TRANSIT', 'RECEIVED'];

const statusConfig: Record<POStatus, { label: string; color: string; bg: string; icon: any; step: number }> = {
  DRAFT:      { label: 'Draft',      color: '#64748B', bg: '#F1F5F9', icon: FileText,     step: 0 },
  ORDERED:    { label: 'Ordered',    color: '#3B82F6', bg: '#EFF6FF', icon: CheckCircle2, step: 1 },
  IN_TRANSIT: { label: 'In Transit', color: '#F59E0B', bg: '#FFFBEB', icon: Truck,        step: 2 },
  RECEIVED:   { label: 'Received',   color: '#10B981', bg: '#ECFDF5', icon: Package,      step: 3 },
  CANCELLED:  { label: 'Cancelled',  color: '#EF4444', bg: '#FEF2F2', icon: AlertCircle,  step: -1 },
};

const getDeliveryDays = (order: PurchaseOrder) => {
  if (!order.expectedDelivery) return null;
  return Math.ceil((new Date(order.expectedDelivery).getTime() - Date.now()) / 86400000);
};

const getDeliveryText = (days: number | null) => {
  if (days === null) return null;
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return 'Arriving today';
  if (days === 1) return 'Arriving tomorrow';
  return `Arriving in ${days}d`;
};

// Progress % based on order creation → expected delivery
const getTransitProgress = (order: PurchaseOrder) => {
  if (!order.expectedDelivery || !order.createdAt) return 65;
  const total = new Date(order.expectedDelivery).getTime() - new Date(order.createdAt).getTime();
  const elapsed = Date.now() - new Date(order.createdAt).getTime();
  return Math.min(95, Math.max(10, Math.round((elapsed / total) * 100)));
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/purchase-orders');
      setOrders(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: string, newStatus: POStatus) => {
    try {
      await api.patch(`/purchase-orders/${id}/status`, { status: newStatus });
      fetchOrders();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to update status'); }
  };

  const receiveOrder = async (id: string) => {
    try {
      await api.post(`/purchase-orders/${id}/receive`, { batchPrefix: 'PO', location: 'Warehouse A' });
      fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to receive order'); }
  };

  const handleDrop = (status: POStatus, orderId: string) => {
    if (status === 'RECEIVED') receiveOrder(orderId);
    else updateStatus(orderId, status);
    setDraggedOrder(null);
  };

  useEffect(() => { fetchOrders(); }, []);

  const stats = {
    total: orders.length,
    active: orders.filter(o => o.status !== 'RECEIVED' && o.status !== 'CANCELLED').length,
    value: orders.reduce((s, o) => s + o.totalAmount, 0),
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <div key={i} className="h-96 rounded-xl animate-shimmer" />)}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Purchase Orders</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Kanban board · Drag & drop to update status · Click card for details
            </p>
          </div>
          <Link href="/orders/new">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 text-white"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
            >
              <Plus className="w-4 h-4" /> New Order
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Orders', value: stats.total, color: '#3B82F6', bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20', icon: Package },
            { label: 'Active Orders', value: stats.active, color: '#F59E0B', bg: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20', icon: Clock },
            { label: 'Total Value', value: `$${stats.value.toFixed(0)}`, color: '#10B981', bg: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20', icon: TrendingUp },
          ].map(s => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className={`bg-gradient-to-br ${s.bg} border-0`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color }}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-4 gap-4">
          {STATUSES.map(status => {
            const config = statusConfig[status];
            const Icon = config.icon;
            const statusOrders = orders.filter(o => o.status === status);

            return (
              <div
                key={status}
                className="flex flex-col gap-3 rounded-xl p-1 transition-all"
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('kanban-drop-target'); }}
                onDragLeave={e => e.currentTarget.classList.remove('kanban-drop-target')}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('kanban-drop-target');
                  if (draggedOrder) handleDrop(status, draggedOrder);
                }}
              >
                {/* Column Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: config.bg }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                    <span className="font-semibold text-sm" style={{ color: config.color }}>{config.label}</span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: config.color, color: 'white' }}
                  >
                    {statusOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 min-h-[400px]">
                  {statusOrders.map(order => {
                    const days = getDeliveryDays(order);
                    const deliveryText = getDeliveryText(days);
                    const urgency = days !== null && days < 0 ? 'overdue' : days !== null && days <= 3 ? 'soon' : 'normal';
                    const borderColor = urgency === 'overdue' ? '#EF4444' : urgency === 'soon' ? '#F59E0B' : 'var(--border)';
                    const progress = getTransitProgress(order);

                    return (
                      <div
                        key={order.id}
                        draggable
                        onDragStart={() => setDraggedOrder(order.id)}
                        onDragEnd={() => setDraggedOrder(null)}
                        onClick={() => setSelectedOrder(order)}
                        className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: `2px solid ${borderColor}`,
                          borderRadius: '12px',
                          padding: '14px',
                          opacity: draggedOrder === order.id ? 0.4 : 1,
                        }}
                      >
                        {/* PO # + auto badge */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                            #{order.poNumber.slice(-6)}
                          </span>
                          {order.isAutoGenerated && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}>
                              AUTO
                            </span>
                          )}
                        </div>

                        {/* Supplier */}
                        <p className="font-semibold text-sm mb-2 truncate" style={{ color: 'var(--foreground)' }}>
                          {order.supplier.name}
                        </p>

                        {/* Items + total */}
                        <div className="flex items-center justify-between mb-3 text-xs" style={{ color: 'var(--muted)' }}>
                          <span className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" /> {order.items.length} items
                          </span>
                          <span className="font-bold" style={{ color: 'var(--foreground)' }}>
                            ${order.totalAmount.toFixed(2)}
                          </span>
                        </div>

                        {/* Delivery countdown with tooltip */}
                        {deliveryText && status !== 'RECEIVED' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="flex items-center gap-1.5 text-xs font-medium cursor-default"
                                style={{ color: urgency === 'overdue' ? '#EF4444' : urgency === 'soon' ? '#F59E0B' : 'var(--muted)' }}
                              >
                                {urgency === 'overdue'
                                  ? <AlertCircle className="w-3.5 h-3.5" />
                                  : <Clock className="w-3.5 h-3.5" />}
                                {deliveryText}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              Expected: {new Date(order.expectedDelivery!).toLocaleDateString()}
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Transit progress bar */}
                        {status === 'IN_TRANSIT' && (
                          <div className="mt-3">
                            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted)' }}>
                              <span>In transit</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-hover)' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${progress}%`, backgroundColor: '#F59E0B' }}
                              />
                            </div>
                          </div>
                        )}

                        {status === 'RECEIVED' && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold mt-1" style={{ color: '#10B981' }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {statusOrders.length === 0 && (
                    <div
                      className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                    >
                      <p className="text-xs">Drop here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── PO Detail Dialog ── */}
        <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
          {selectedOrder && (() => {
            const cfg = statusConfig[selectedOrder.status];
            const Icon = cfg.icon;
            const days = getDeliveryDays(selectedOrder);
            const progress = getTransitProgress(selectedOrder);
            const PIPELINE: POStatus[] = ['DRAFT', 'ORDERED', 'IN_TRANSIT', 'RECEIVED'];

            return (
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                      <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <DialogTitle>PO #{selectedOrder.poNumber.slice(-8)}</DialogTitle>
                      <DialogDescription>{selectedOrder.supplier.name}</DialogDescription>
                    </div>
                    <span
                      className="ml-auto text-xs font-bold px-3 py-1 rounded-full"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </DialogHeader>

                {/* Delivery pipeline */}
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
                    Delivery Pipeline
                  </p>
                  <div className="flex items-center gap-1">
                    {PIPELINE.map((s, i) => {
                      const sCfg = statusConfig[s];
                      const done = statusConfig[selectedOrder.status].step > i;
                      const active = selectedOrder.status === s;
                      return (
                        <div key={s} className="flex items-center flex-1">
                          <div
                            className="flex-1 text-center py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                            style={{
                              backgroundColor: active ? sCfg.color : done ? sCfg.color + '33' : 'var(--surface-hover)',
                              color: active ? 'white' : done ? sCfg.color : 'var(--muted)',
                            }}
                          >
                            {sCfg.label}
                          </div>
                          {i < 3 && (
                            <div className="w-3 h-0.5 mx-0.5" style={{ backgroundColor: done ? '#10B981' : 'var(--border)' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Transit progress */}
                  {selectedOrder.status === 'IN_TRANSIT' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted)' }}>
                        <span>Shipment progress</span>
                        <span className="font-semibold" style={{ color: '#F59E0B' }}>{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-hover)' }}>
                        <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: '#F59E0B' }} />
                      </div>
                    </div>
                  )}

                  {/* Delivery countdown */}
                  {days !== null && selectedOrder.status !== 'RECEIVED' && (
                    <div
                      className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
                      style={{
                        backgroundColor: days < 0 ? '#FEF2F2' : days <= 3 ? '#FFFBEB' : 'var(--surface-hover)',
                        color: days < 0 ? '#EF4444' : days <= 3 ? '#F59E0B' : 'var(--foreground)',
                      }}
                    >
                      <Calendar className="w-4 h-4" />
                      {getDeliveryText(days)} · {new Date(selectedOrder.expectedDelivery!).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                    Order Items ({selectedOrder.items.length})
                  </p>
                  {selectedOrder.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ backgroundColor: 'var(--surface-hover)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
                          <Package className="w-4 h-4" style={{ color: '#3B82F6' }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{item.product.name}</p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            {item.quantity} {item.product.unit} × ${item.unitCost}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                        ${item.totalCost.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total + actions */}
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
                >
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <DollarSign className="w-4 h-4" /> Total
                  </div>
                  <span className="text-xl font-bold text-white">${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>

                {/* Status action buttons */}
                <div className="flex gap-2">
                  {selectedOrder.status === 'DRAFT' && (
                    <button
                      onClick={() => { updateStatus(selectedOrder.id, 'ORDERED'); setSelectedOrder(null); }}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
                      style={{ backgroundColor: '#3B82F6' }}
                    >
                      Mark as Ordered
                    </button>
                  )}
                  {selectedOrder.status === 'ORDERED' && (
                    <button
                      onClick={() => { updateStatus(selectedOrder.id, 'IN_TRANSIT'); setSelectedOrder(null); }}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
                      style={{ backgroundColor: '#F59E0B' }}
                    >
                      Mark In Transit
                    </button>
                  )}
                  {(selectedOrder.status === 'ORDERED' || selectedOrder.status === 'IN_TRANSIT') && (
                    <button
                      onClick={() => receiveOrder(selectedOrder.id)}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      Receive Order
                    </button>
                  )}
                </div>

                {selectedOrder.notes && (
                  <p className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--surface-hover)', color: 'var(--muted)' }}>
                    <strong style={{ color: 'var(--foreground)' }}>Notes:</strong> {selectedOrder.notes}
                  </p>
                )}
              </DialogContent>
            );
          })()}
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

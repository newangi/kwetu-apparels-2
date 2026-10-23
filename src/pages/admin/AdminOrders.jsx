import React, { useEffect, useState, useMemo } from 'react';
import { Search, ChevronRight, X, Phone, MapPin, Truck, Store } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { KES, ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from '@/lib/format';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const o = await base44.entities.Order.list('-created_date', 300);
      setOrders(o);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (search && !o.order_number.toLowerCase().includes(search.toLowerCase()) && !o.customer_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (paymentFilter && o.payment_method !== paymentFilter) return false;
      if (dateFilter && !new Date(o.created_date).toISOString().startsWith(dateFilter)) return false;
      return true;
    });
  }, [orders, search, statusFilter, paymentFilter, dateFilter]);

  const updateStatus = async (id, status) => {
    await base44.entities.Order.update(id, { status });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    setSelected(s => s && s.id === id ? { ...s, status } : s);
  };

  const statusColor = (s) => ({ pending: '#94918B', processing: '#1A2B48', ready_for_pickup: '#C58F21', out_for_delivery: '#C58F21', completed: '#3A8A4A', cancelled: '#94918B' }[s] || '#94918B');

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Manage</p>
        <h1 className="font-heading text-3xl font-bold text-primary">Orders</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="input-field pl-10" placeholder="Search order # or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input-field w-auto" value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
          <option value="">All Payments</option>
          <option value="cash_on_pickup">Cash on Pickup</option>
          <option value="cash_on_delivery">Cash on Delivery</option>
          <option value="mpesa">M-Pesa</option>
          <option value="card">Card</option>
        </select>
        <input type="date" className="input-field w-auto" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card p-12 text-center text-muted-foreground">No orders match your filters.</div>
      ) : (
        <div className="bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="stitched-b">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-4">Order #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Fulfillment</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="stitched-b hover:bg-secondary/30 cursor-pointer" onClick={() => setSelected(o)}>
                  <td className="p-4 font-medium text-primary">{o.order_number}</td>
                  <td className="p-4">{o.customer_name}</td>
                  <td className="p-4 text-muted-foreground">{o.fulfillment_method === 'pickup' ? 'Pickup' : 'Delivery'}</td>
                  <td className="p-4 text-muted-foreground capitalize">{o.payment_method.replace(/_/g, ' ')}</td>
                  <td className="p-4 font-medium">{KES(o.total)}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium" style={{ backgroundColor: statusColor(o.status) + '20', color: statusColor(o.status) }}>
                      {ORDER_STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{new Date(o.created_date).toLocaleDateString('en-KE')}</td>
                  <td className="p-4"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-background shadow-2xl flex flex-col animate-slide-in overflow-y-auto">
            <div className="flex items-center justify-between p-5 stitched-b sticky top-0 bg-background z-10">
              <div>
                <h3 className="font-heading text-lg font-bold text-primary">{selected.order_number}</h3>
                <p className="text-xs text-muted-foreground">{new Date(selected.created_date).toLocaleString('en-KE')}</p>
              </div>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-primary" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Customer */}
              <div>
                <p className="label-field">Customer</p>
                <p className="text-sm font-medium text-foreground">{selected.customer_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><Phone className="w-3.5 h-3.5" /> {selected.customer_phone}</p>
                {selected.customer_email && <p className="text-sm text-muted-foreground">{selected.customer_email}</p>}
              </div>

              {/* Fulfillment */}
              <div className="stitched-t pt-4">
                <p className="label-field">Fulfillment</p>
                <div className="flex items-start gap-2">
                  {selected.fulfillment_method === 'pickup' ? <Store className="w-4 h-4 text-accent mt-0.5" /> : <Truck className="w-4 h-4 text-accent mt-0.5" />}
                  <div>
                    <p className="text-sm font-medium">{selected.fulfillment_method === 'pickup' ? 'Store Pickup — Ridgeways Mall' : 'Nairobi Delivery'}</p>
                    {selected.delivery_address && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {selected.delivery_address}</p>}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="stitched-t pt-4">
                <p className="label-field">Items</p>
                <div className="space-y-3">
                  {selected.items?.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-12 h-12 bg-secondary overflow-hidden shrink-0">{item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}</div>
                      <div className="flex-1"><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-muted-foreground">Size {item.size} · Qty {item.quantity}</p></div>
                      <span className="text-sm">{KES(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="stitched-t pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{KES(selected.subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Delivery</span><span>{selected.delivery_fee === 0 ? 'Free' : KES(selected.delivery_fee)}</span></div>
                <div className="flex justify-between text-base font-bold pt-2 stitched-t"><span className="text-primary">Total</span><span className="text-primary">{KES(selected.total)}</span></div>
                <p className="text-xs text-muted-foreground capitalize">Payment: {selected.payment_method.replace(/_/g, ' ')} ({selected.payment_status})</p>
              </div>

              {/* Status update */}
              <div className="stitched-t pt-4">
                <p className="label-field">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {ORDER_STATUS_FLOW.map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`px-3 py-2.5 text-xs uppercase tracking-wider border transition-all ${selected.status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:border-primary'}`}
                    >
                      {ORDER_STATUS_LABELS[s]}
                    </button>
                  ))}
                  <button
                    onClick={() => updateStatus(selected.id, 'cancelled')}
                    className={`px-3 py-2.5 text-xs uppercase tracking-wider border transition-all ${selected.status === 'cancelled' ? 'bg-destructive text-destructive-foreground border-destructive' : 'border-input hover:border-destructive text-destructive'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {selected.notes && (
                <div className="stitched-t pt-4">
                  <p className="label-field">Notes</p>
                  <p className="text-sm text-muted-foreground">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
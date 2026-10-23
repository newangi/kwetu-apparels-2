import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { KES, ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from '@/lib/format';

export default function Account() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me().catch(() => null);
        setUser(u);
        const all = await base44.entities.Order.list('-created_date', 100);
        setOrders(all);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const statusColor = (status) => {
    const map = { pending: '#94918B', processing: '#1A2B48', ready_for_pickup: '#C58F21', out_for_delivery: '#C58F21', completed: '#3A8A4A', cancelled: '#94918B' };
    return map[status] || '#94918B';
  };

  return (
    <div className="bg-secondary/20 min-h-screen">
      <div className="container-academic py-10 md:py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">My Account</p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-8">
          {user ? `Welcome, ${user.full_name || user.email}` : 'Order History'}
        </h1>

        {loading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="bg-card p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">You have no orders yet.</p>
            <Link to="/catalog" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const stepIndex = ORDER_STATUS_FLOW.indexOf(order.status);
              return (
                <Link key={order.id} to={`/order/${order.id}`} className="block bg-card p-5 md:p-6 hover:shadow-md transition-shadow group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-primary">{order.order_number}</span>
                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium" style={{ backgroundColor: statusColor(order.status) + '20', color: statusColor(order.status) }}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{new Date(order.created_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-sm text-foreground">{order.items?.length} {order.items?.length === 1 ? 'item' : 'items'} · {order.fulfillment_method === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-primary">{KES(order.total)}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                  </div>

                  {/* Status progress */}
                  {order.status !== 'cancelled' && stepIndex >= 0 && (
                    <div className="mt-4 pt-4 stitched-t">
                      <div className="flex items-center gap-1">
                        {ORDER_STATUS_FLOW.map((s, i) => (
                          <React.Fragment key={s}>
                            <div className={`flex-1 h-1 ${i <= stepIndex ? 'bg-accent' : 'bg-muted'}`} />
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        {ORDER_STATUS_FLOW.map((s, i) => (
                          <span key={s} className={`text-[9px] uppercase tracking-wider ${i <= stepIndex ? 'text-accent font-medium' : 'text-muted-foreground/50'}`}>
                            {ORDER_STATUS_LABELS[s].split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
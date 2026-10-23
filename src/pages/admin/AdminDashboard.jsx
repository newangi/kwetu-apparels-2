import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { KES, ORDER_STATUS_LABELS } from '@/lib/format';

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [o, p] = await Promise.all([
          base44.entities.Order.list('-created_date', 200),
          base44.entities.Product.list('-created_date', 200)
        ]);
        setOrders(o); setProducts(p);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const stats = useMemo(() => {
    const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outStock = products.filter(p => p.stock <= 0).length;
    return { revenue, totalOrders: orders.length, pending, lowStock, outStock };
  }, [orders, products]);

  const topProducts = useMemo(() => {
    const counts = {};
    orders.forEach(o => o.items?.forEach(i => {
      counts[i.name] = (counts[i.name] || 0) + i.quantity;
    }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);

  const recentOrders = orders.slice(0, 6);

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse" />)}</div>;

  const cards = [
    { label: 'Total Revenue', value: KES(stats.revenue), icon: TrendingUp, tone: 'primary' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, tone: 'accent' },
    { label: 'Pending Orders', value: stats.pending, icon: Package, tone: 'primary' },
    { label: 'Low / Out of Stock', value: `${stats.lowStock} / ${stats.outStock}`, icon: AlertTriangle, tone: 'accent' },
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Overview</p>
        <h1 className="font-heading text-3xl font-bold text-primary">Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</span>
              <c.icon className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-primary">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-lg font-bold text-primary">Recent Orders</h2>
            <Link to="/admin/orders" className="flex items-center gap-1 text-xs uppercase tracking-wider text-accent hover:underline">View All <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(o => (
                <Link key={o.id} to="/admin/orders" className="flex items-center justify-between py-2 stitched-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{o.customer_name} · {ORDER_STATUS_LABELS[o.status]}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{KES(o.total)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-lg font-bold text-primary">Top Selling</h2>
            <Link to="/admin/products" className="flex items-center gap-1 text-xs uppercase tracking-wider text-accent hover:underline">Manage <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map(([name, qty], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-accent w-5">{i + 1}</span>
                  <span className="text-sm text-foreground flex-1 truncate">{name}</span>
                  <span className="text-sm text-muted-foreground">{qty} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stock levels */}
      <div className="bg-card p-6 mt-6">
        <h2 className="font-heading text-lg font-bold text-primary mb-5">Stock Levels at a Glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {products.slice(0, 8).map(p => (
            <div key={p.id} className="stitched p-3">
              <p className="text-xs text-foreground truncate mb-1">{p.name}</p>
              <p className={`text-sm font-bold ${p.stock <= 0 ? 'text-muted-foreground' : p.stock <= 5 ? 'text-accent' : 'text-[#3A8A4A]'}`}>{p.stock} in stock</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
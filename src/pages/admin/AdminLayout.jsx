import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Tags, LogOut, Menu, X, Store } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);
        if (u.role !== 'admin') { navigate('/'); }
      } catch (e) {
        navigate('/login');
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
  ];

  return (
    <div className="min-h-screen bg-secondary/20 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-primary text-primary-foreground flex flex-col transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 stitched-b border-primary-foreground/15">
          <Link to="/admin" className="flex flex-col leading-none">
            <span className="font-heading text-xl font-bold tracking-tight">KWETU</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-accent -mt-0.5">Admin Panel</span>
          </Link>
        </div>
        <nav className="flex-1 py-4">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${isActive ? 'bg-accent text-accent-foreground' : 'text-primary-foreground/80 hover:bg-primary-foreground/10'}`}
            >
              <l.icon className="w-4 h-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-foreground/15 space-y-2">
          <Link to="/" className="flex items-center gap-3 px-2 py-2 text-sm text-primary-foreground/70 hover:text-accent">
            <Store className="w-4 h-4" /> View Store
          </Link>
          <button onClick={async () => { await base44.auth.logout('/login'); }} className="flex items-center gap-3 px-2 py-2 text-sm text-primary-foreground/70 hover:text-accent w-full">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-card p-4 flex items-center justify-between stitched-b">
          <button onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5 text-primary" /></button>
          <span className="font-heading font-bold text-primary">Admin</span>
          <div className="w-5" />
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
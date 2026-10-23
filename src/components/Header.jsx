import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Search } from 'lucide-react';
import { useCart } from '@/lib/cartContext';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, setIsOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navLinks = [
    { label: 'Shop All', to: '/catalog' },
    { label: 'Shirts', to: '/catalog/shirts' },
    { label: 'Trousers', to: '/catalog/trousers' },
    { label: 'Sweaters', to: '/catalog/sweaters' },
    { label: 'Sportswear', to: '/catalog/sportswear' },
    { label: 'Shoes', to: '/catalog/shoes' },
    { label: 'Measure', to: '/measure' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-background/95 backdrop-blur-md shadow-sm' : 'bg-background'
        }`}
      >
        <div className="stitched-b">
          <div className="container-academic flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-8">
              <button className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
                <Menu className="w-5 h-5 text-primary" />
              </button>
              <Link to="/" className="flex flex-col leading-none">
                <span className="font-heading text-xl md:text-2xl font-bold text-primary tracking-tight">KWETU</span>
                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-accent -mt-0.5">Apparels</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map(l => (
                <Link key={l.to} to={l.to} className="text-xs uppercase tracking-wider text-foreground/80 hover:text-accent transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3 md:gap-5">
              <Link to="/account" className="text-primary hover:text-accent transition-colors" aria-label="Account">
                <User className="w-5 h-5" />
              </Link>
              <button onClick={() => setIsOpen(true)} className="relative text-primary hover:text-accent transition-colors" aria-label="Cart">
                <ShoppingBag className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-background shadow-xl animate-slide-in" style={{ animation: 'slide-in-right 0.3s ease-out reverse' }}>
            <div className="flex items-center justify-between p-5 stitched-b">
              <span className="font-heading text-lg font-bold text-primary">Menu</span>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-primary" /></button>
            </div>
            <nav className="flex flex-col">
              {navLinks.map(l => (
                <Link key={l.to} to={l.to} className="px-5 py-4 stitched-b text-sm uppercase tracking-wider text-foreground/80 hover:text-accent hover:bg-secondary/40">
                  {l.label}
                </Link>
              ))}
              <Link to="/account" className="px-5 py-4 text-sm uppercase tracking-wider text-foreground/80 hover:text-accent">Account</Link>
              <Link to="/admin" className="px-5 py-4 text-sm uppercase tracking-wider text-accent">Admin Dashboard</Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
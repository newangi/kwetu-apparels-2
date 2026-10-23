import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="container-academic py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex flex-col leading-none mb-4">
              <span className="font-heading text-2xl font-bold tracking-tight">KWETU</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-accent -mt-0.5">Apparels</span>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed max-w-xs">
              Excellence Every Wear. Quality school uniforms for Nairobi's students, trusted by parents across the city.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-accent mb-4">Shop</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/70">
              <li><Link to="/catalog" className="hover:text-accent">All Products</Link></li>
              <li><Link to="/catalog/shirts" className="hover:text-accent">Shirts</Link></li>
              <li><Link to="/catalog/trousers" className="hover:text-accent">Trousers</Link></li>
              <li><Link to="/catalog/sweaters" className="hover:text-accent">Sweaters</Link></li>
              <li><Link to="/catalog/shoes" className="hover:text-accent">Shoes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-accent mb-4">Visit Us</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                <span>Ridgeways Mall, Kiambu Road, Nairobi</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                <span>+254 700 000 000</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                <span>Mon–Sat: 9am – 7pm<br />Sun: 10am – 5pm</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-accent mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm text-primary-foreground/70">
              <li><Link to="/account" className="hover:text-accent">My Orders</Link></li>
              <li><Link to="/admin" className="hover:text-accent">Admin Dashboard</Link></li>
              <li className="flex items-center gap-3 pt-2">
                <a href="#" aria-label="Instagram" className="hover:text-accent"><Instagram className="w-4 h-4" /></a>
                <a href="#" aria-label="Facebook" className="hover:text-accent"><Facebook className="w-4 h-4" /></a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary-foreground/15 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-primary-foreground/50">© {new Date().getFullYear()} Kwetu Apparels. All rights reserved.</p>
          <p className="text-xs text-primary-foreground/50">Excellence Every Wear</p>
        </div>
      </div>
    </footer>
  );
}
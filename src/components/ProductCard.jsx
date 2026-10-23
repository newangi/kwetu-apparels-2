import React from 'react';
import { Link } from 'react-router-dom';
import { KES, stockStatus } from '@/lib/format';

export default function ProductCard({ product }) {
  const status = stockStatus(product.stock);
  const image = product.images?.[0];

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative aspect-square bg-secondary overflow-hidden mb-3">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs uppercase tracking-widest text-muted-foreground/50">Kwetu</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/90 backdrop-blur px-2 py-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${status.tone === 'in' ? 'pulse-dot' : ''}`}
            style={{ backgroundColor: status.color }}
          />
          <span className="text-[10px] uppercase tracking-wider text-foreground">{status.label}</span>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{product.category_name}</p>
        <h3 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors leading-snug">{product.name}</h3>
        <p className="text-sm font-bold text-primary">{KES(product.price)}</p>
      </div>
    </Link>
  );
}
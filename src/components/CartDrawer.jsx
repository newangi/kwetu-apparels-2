import React from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { KES } from '@/lib/format';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, subtotal, count } = useCart();

  if (!isOpen) return null;

  const FREE_DELIVERY_THRESHOLD = 5000;
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-background shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 stitched-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h3 className="font-heading text-lg font-bold text-primary">Your Cart ({count})</h3>
          </div>
          <button onClick={() => setIsOpen(false)} aria-label="Close cart"><X className="w-5 h-5 text-primary" /></button>
        </div>

        {/* Free delivery progress */}
        {items.length > 0 && (
          <div className="px-5 py-3 bg-secondary/40">
            <p className="text-xs text-muted-foreground mb-2">
              {subtotal >= FREE_DELIVERY_THRESHOLD
                ? 'You qualify for free Nairobi delivery!'
                : `Add ${KES(FREE_DELIVERY_THRESHOLD - subtotal)} more for free Nairobi delivery`}
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground mb-6">Your cart is empty</p>
              <button onClick={() => setIsOpen(false)} className="btn-outline">Continue Shopping</button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.size}`} className="flex gap-4 p-5">
                  <div className="w-16 h-16 bg-secondary rounded shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">Size: {item.size}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-input">
                        <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity - 1)} className="px-2 py-1 hover:bg-secondary"><Minus className="w-3 h-3" /></button>
                        <span className="px-3 text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.size, item.quantity + 1)} className="px-2 py-1 hover:bg-secondary"><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-primary">{KES(item.price * item.quantity)}</span>
                        <button onClick={() => removeItem(item.product_id, item.size)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 stitched-t bg-card">
            <div className="flex justify-between mb-4">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-lg font-bold text-primary">{KES(subtotal)}</span>
            </div>
            <Link to="/checkout" onClick={() => setIsOpen(false)} className="btn-primary w-full block text-center">
              Checkout
            </Link>
            <button onClick={() => setIsOpen(false)} className="w-full text-center text-xs text-muted-foreground mt-3 hover:text-primary">Continue Shopping</button>
          </div>
        )}
      </div>
    </div>
  );
}
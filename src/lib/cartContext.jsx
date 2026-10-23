import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('kwetu_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('kwetu_cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, size, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id && i.size === size);
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id && i.size === size
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        size,
        image: product.images?.[0] || ''
      }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId, size) => {
    setItems(prev => prev.filter(i => !(i.product_id === productId && i.size === size)));
  }, []);

  const updateQuantity = useCallback((productId, size, quantity) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => !(i.product_id === productId && i.size === size)));
      return;
    }
    setItems(prev => prev.map(i =>
      i.product_id === productId && i.size === size
        ? { ...i, quantity }
        : i
    ));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, count, subtotal, isOpen,
      setIsOpen, addItem, removeItem, updateQuantity, clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
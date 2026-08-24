'use client';

export interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number; // price in KES
  quantity: number;
  img: string;
  alt: string;
  slug: string;
}

const CART_KEY = 'nyotas_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart();
  const existing = cart.find((c) => c.id === item.id);
  let updated: CartItem[];
  if (existing) {
    updated = cart.map((c) =>
      c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
    );
  } else {
    updated = [...cart, { ...item, quantity: 1 }];
  }
  saveCart(updated);
  return updated;
}

export function removeFromCart(id: string): CartItem[] {
  let updated = getCart().filter((c) => c.id !== id);
  saveCart(updated);
  return updated;
}

export function updateCartQty(id: string, quantity: number): CartItem[] {
  let updated = getCart().map((c) =>
    c.id === id ? { ...c, quantity: Math.max(1, quantity) } : c
  );
  saveCart(updated);
  return updated;
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function clearCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_KEY);
}

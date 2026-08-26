'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { getCart, saveCart, CartItem } from '@/lib/cart';

import { useAuth } from '@/contexts/AuthContext';

const KES_RATE = 130;

function formatKES(kes: number): string {
  return `KSh ${kes.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

const promoMap: Record<string, number> = {
  NYOTAS10: 10,
  WELCOME20: 20,
  SAVE15: 15,
};

export default function CartClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setItems(getCart());
    setMounted(true);

    const onStorage = () => setItems(getCart());
    window.addEventListener('cart-updated', onStorage);
    return () => window.removeEventListener('cart-updated', onStorage);
  }, []);

  const persist = (updated: CartItem[]) => {
    saveCart(updated);
    setItems(updated);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQty = (id: string, delta: number) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    persist(updated);
  };

  const removeItem = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      const updated = items.filter((item) => item.id !== id);
      persist(updated);
      setRemovingId(null);
    }, 350);
  };

  const applyPromo = () => {
    const upper = promoCode.trim().toUpperCase();
    if (promoMap[upper]) {
      setAppliedPromo({ code: upper, discount: promoMap[upper] });
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try NYOTAS10.');
      setAppliedPromo(null);
    }
  };

  // All prices stored in KES
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedPromo ? subtotal * appliedPromo.discount / 100 : 0;
  const total = subtotal - discountAmount;

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login?next=/cart');
      return;
    }
    if (items.length === 0) return;

    // Redirect to delivery page instead of directly checking out
    const params = new URLSearchParams();
    if (appliedPromo) {
      params.set('promo', appliedPromo.code);
      params.set('discount', String(appliedPromo.discount));
    }
    router.push(`/delivery${params.toString() ? '?' + params.toString() : ''}`);
  };

  if (!mounted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors font-medium">Home</Link>
        <Icon name="ChevronRightIcon" size={12} />
        <Link href="/products" className="hover:text-foreground transition-colors font-medium">Products</Link>
        <Icon name="ChevronRightIcon" size={12} />
        <span className="text-foreground font-bold">Cart</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-display text-foreground">
          Your <span className="text-primary">Cart</span>
        </h1>
        <p className="text-muted-foreground mt-2">{items.length} item{items.length !== 1 ? 's' : ''} in your bag</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
            <Icon name="ShoppingBagIcon" size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Start browsing to find pieces you'll love.</p>
          <Link href="/products" className="btn-primary">
            Shop Now
            <Icon name="ArrowRightIcon" size={18} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-warm"
                style={{
                  transition: 'opacity 0.35s ease, transform 0.35s ease',
                  opacity: removingId === item.id ? 0 : 1,
                  transform: removingId === item.id ? 'translateX(20px)' : 'translateX(0)',
                }}
              >
                <div className="flex gap-0">
                  {/* Image */}
                  <div className="w-32 sm:w-40 flex-shrink-0 relative overflow-hidden bg-secondary">
                    <AppImage
                      src={item.img || '/assets/images/no_image.png'}
                      alt={item.alt || item.name}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{item.category}</p>
                        <h3 className="font-black text-foreground text-base leading-tight">{item.name}</h3>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
                      >
                        <Icon name="TrashIcon" size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity */}
                      <div className="flex items-center gap-1 bg-secondary border border-border rounded-full p-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="qty-btn w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Icon name="MinusIcon" size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-black text-foreground">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="qty-btn w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted"
                        >
                          <Icon name="PlusIcon" size={14} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-xl font-black text-foreground">{formatKES(item.price * item.quantity)}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">{formatKES(item.price)} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue shopping */}
            <Link href="/products" className="btn-ghost self-start mt-2">
              <Icon name="ArrowLeftIcon" size={16} />
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-warm">
              <h2 className="font-black text-foreground text-lg mb-6 uppercase tracking-wide">Order Summary</h2>

              {/* Line items */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-bold text-foreground">{formatKES(subtotal)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-bold">Promo ({appliedPromo.code})</span>
                    <span className="font-bold text-green-600">-{formatKES(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Promo Code</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
                    placeholder="Enter code"
                    className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    onKeyDown={(e) => { if (e.key === 'Enter') applyPromo(); }}
                  />
                  <button
                    onClick={applyPromo}
                    className="px-4 py-3 bg-secondary border border-border rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoError && <p className="text-xs text-red-500 mt-1.5 font-medium">{promoError}</p>}
                {appliedPromo && (
                  <p className="text-xs text-green-600 mt-1.5 font-bold flex items-center gap-1">
                    <Icon name="CheckCircleIcon" size={12} variant="solid" /> {appliedPromo.discount}% discount applied!
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-border pt-5 mb-6">
                <div className="flex justify-between">
                  <span className="text-base font-black text-foreground uppercase tracking-wide">Total</span>
                  <span className="text-2xl font-black text-foreground">{formatKES(total)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tax included in prices</p>
              </div>

              {checkoutError && (
                <p className="text-sm text-red-600 font-medium mb-4 p-3 bg-red-50 rounded-xl">{checkoutError}</p>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="btn-primary w-full justify-center text-sm disabled:opacity-60"
              >
                {checkingOut ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Placing Order…
                  </>
                ) : (
                  <>
                    <Icon name="LockClosedIcon" size={16} />
                    {user ? 'Secure Checkout' : 'Sign In to Checkout'}
                  </>
                )}
              </button>

              {/* Trust signals */}
              <div className="mt-5 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon name="LockClosedIcon" size={12} />
                  SSL Secure
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Icon name="ArrowPathIcon" size={12} />
                  Free Returns
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Icon name="TruckIcon" size={12} />
                  Fast Ship
                </span>
              </div>

              {/* Payment icons row */}
              <div className="mt-4 flex items-center justify-center gap-2">
                {['VISA', 'MC', 'AMEX', 'M-PESA'].map((pay) => (
                  <div key={pay} className="px-2.5 py-1.5 bg-secondary border border-border rounded-lg text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    {pay}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  img: string;
  alt: string;
  color: string;
}

const initialItems: CartItem[] = [
{
  id: 1,
  name: 'Linen Cloud Sofa',
  category: 'Living Room',
  price: 899,
  quantity: 1,
  img: "https://img.rocket.new/generatedImages/rocket_gen_img_14cd98208-1772851737802.png",
  alt: 'Plush linen sofa in warm sand color with rounded arms and deep cushions on a light hardwood floor',
  color: 'Sand Linen'
},
{
  id: 2,
  name: 'Terracotta Mug Set',
  category: 'Kitchenware',
  price: 54,
  quantity: 2,
  img: "https://images.unsplash.com/photo-1688938675788-657ea207453a",
  alt: 'Set of four handcrafted terracotta mugs with matte glaze arranged on a rustic wooden surface in warm morning light',
  color: 'Terracotta'
},
{
  id: 3,
  name: 'Ceramic Vase Trio',
  category: 'Décor',
  price: 89,
  quantity: 1,
  img: "https://images.unsplash.com/photo-1590860778262-2d8ddead7c1a",
  alt: 'Three ceramic vases in graduated sizes with matte white and cream glazes on a light wooden shelf',
  color: 'Matte White'
}];


const promoMap: Record<string, number> = {
  HOMEVIBE10: 10,
  WELCOME20: 20,
  SUMMER15: 15
};

export default function CartClient() {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string;discount: number;} | null>(null);
  const [promoError, setPromoError] = useState('');
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const updateQty = (id: number, delta: number) => {
    setItems((prev) =>
    prev.map((item) =>
    item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    )
    );
  };

  const removeItem = (id: number) => {
    setRemovingId(id);
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      setRemovingId(null);
    }, 350);
  };

  const applyPromo = () => {
    const upper = promoCode.trim().toUpperCase();
    if (promoMap[upper]) {
      setAppliedPromo({ code: upper, discount: promoMap[upper] });
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try HOMEVIBE10.');
      setAppliedPromo(null);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 75 ? 0 : 8.99;
  const tax = subtotal * 0.085;
  const discountAmount = appliedPromo ? subtotal * appliedPromo.discount / 100 : 0;
  const total = subtotal + shipping + tax - discountAmount;

  if (checkoutDone) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Icon name="CheckCircleIcon" size={40} className="text-green-500" variant="solid" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-3">Order Confirmed!</h1>
        <p className="text-muted-foreground text-lg max-w-md mb-8">
          Thanks for shopping with HomeVibe. You'll receive a confirmation email at your address shortly.
        </p>
        <div className="bg-secondary border border-border rounded-2xl p-6 max-w-sm w-full mb-8 text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Order Summary</p>
          <div className="flex justify-between text-sm font-semibold text-foreground mb-1">
            <span>Order Total</span>
            <span className="font-black">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Estimated Delivery</span>
            <span>3–5 business days</span>
          </div>
        </div>
        <Link href="/products" className="btn-primary">
          Continue Shopping
          <Icon name="ArrowRightIcon" size={18} />
        </Link>
      </div>);

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

      {items.length === 0 ?
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
        </div> :

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Free shipping progress */}
            {subtotal < 75 &&
          <div className="bg-secondary border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="TruckIcon" size={16} className="text-primary" />
                  <p className="text-sm font-bold text-foreground">
                    Add <span className="text-primary">${(75 - subtotal).toFixed(2)}</span> more for free shipping!
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(subtotal / 75 * 100, 100)}%` }} />
              
                </div>
              </div>
          }
            {subtotal >= 75 &&
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                <Icon name="CheckCircleIcon" size={18} className="text-green-600" variant="solid" />
                <p className="text-sm font-bold text-green-800">You qualify for free shipping!</p>
              </div>
          }

            {items.map((item) =>
          <div
            key={item.id}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-warm"
            style={{
              transition: 'opacity 0.35s ease, transform 0.35s ease',
              opacity: removingId === item.id ? 0 : 1,
              transform: removingId === item.id ? 'translateX(20px)' : 'translateX(0)'
            }}>
            
                <div className="flex gap-0">
                  {/* Image */}
                  <div className="w-32 sm:w-40 flex-shrink-0 relative overflow-hidden bg-secondary">
                    <AppImage
                  src={item.img}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="160px" />
                
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{item.category}</p>
                        <h3 className="font-black text-foreground text-base leading-tight">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Color: {item.color}</p>
                      </div>
                      <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex-shrink-0">
                    
                        <Icon name="TrashIcon" size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity */}
                      <div className="flex items-center gap-1 bg-secondary border border-border rounded-full p-1">
                        <button
                      onClick={() => updateQty(item.id, -1)}
                      disabled={item.quantity <= 1}
                      className="qty-btn w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed">
                      
                          <Icon name="MinusIcon" size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-black text-foreground">{item.quantity}</span>
                        <button
                      onClick={() => updateQty(item.id, 1)}
                      className="qty-btn w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted">
                      
                          <Icon name="PlusIcon" size={14} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-xl font-black text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                        {item.quantity > 1 &&
                    <p className="text-xs text-muted-foreground">${item.price} each</p>
                    }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}

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
                  <span className="font-bold text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={`font-bold ${shipping === 0 ? 'text-green-600' : 'text-foreground'}`}>
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8.5%)</span>
                  <span className="font-bold text-foreground">${tax.toFixed(2)}</span>
                </div>
                {appliedPromo &&
              <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-bold">Promo ({appliedPromo.code})</span>
                    <span className="font-bold text-green-600">-${discountAmount.toFixed(2)}</span>
                  </div>
              }
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Promo Code</p>
                <div className="flex gap-2">
                  <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {setPromoCode(e.target.value);setPromoError('');}}
                  placeholder="Enter code"
                  className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => {if (e.key === 'Enter') applyPromo();}} />
                
                  <button
                  onClick={applyPromo}
                  className="px-4 py-3 bg-secondary border border-border rounded-xl text-sm font-bold text-foreground hover:bg-muted transition-colors">
                  
                    Apply
                  </button>
                </div>
                {promoError && <p className="text-xs text-red-500 mt-1.5 font-medium">{promoError}</p>}
                {appliedPromo &&
              <p className="text-xs text-green-600 mt-1.5 font-bold flex items-center gap-1">
                    <Icon name="CheckCircleIcon" size={12} variant="solid" /> {appliedPromo.discount}% discount applied!
                  </p>
              }
              </div>

              {/* Divider */}
              <div className="border-t border-border pt-5 mb-6">
                <div className="flex justify-between">
                  <span className="text-base font-black text-foreground uppercase tracking-wide">Total</span>
                  <span className="text-2xl font-black text-foreground">${total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Including all taxes</p>
              </div>

              {/* Checkout Button */}
              <button
              onClick={() => setCheckoutDone(true)}
              className="btn-primary w-full justify-center text-sm">
              
                <Icon name="LockClosedIcon" size={16} />
                Secure Checkout
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
                {['VISA', 'MC', 'AMEX', 'PayPal'].map((pay) =>
              <div key={pay} className="px-2.5 py-1.5 bg-secondary border border-border rounded-lg text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    {pay}
                  </div>
              )}
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}
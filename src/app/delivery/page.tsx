'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCart, clearCart } from '@/lib/cart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
}

function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

function DeliveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<PickupLocation | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [nearestLocation, setNearestLocation] = useState<PickupLocation | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const promoCode = searchParams.get('promo') || '';
  const promoDiscount = parseInt(searchParams.get('discount') || '0');
  const cartItems = getCart();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = promoDiscount > 0 ? subtotal * promoDiscount / 100 : 0;
  const total = subtotal - discountAmount;

  useEffect(() => {
    if (!user) {
      router.replace('/login?next=/delivery');
      return;
    }
    if (cartItems.length === 0) {
      router.replace('/cart');
      return;
    }
    const fetchLocations = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('pickup_locations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (data) setLocations(data);
      setLoadingLocations(false);
    };
    fetchLocations();
  }, [user]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Find nearest pickup location
        let nearest: PickupLocation | null = null;
        let minDist = Infinity;
        for (const loc of locations) {
          if (loc.latitude != null && loc.longitude != null) {
            const dist = Math.sqrt(
              Math.pow(latitude - loc.latitude, 2) + Math.pow(longitude - loc.longitude, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              nearest = loc;
            }
          }
        }
        if (nearest) {
          setNearestLocation(nearest);
          setSelectedLocation(nearest);
        } else {
          setLocationError('Could not find a nearby pickup location.');
        }
        setDetectingLocation(false);
      },
      (err) => {
        setLocationError('Unable to detect your location. Please select a pickup point manually.');
        setDetectingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  const handleConfirmOrder = async () => {
    if (!selectedLocation) {
      setOrderError('Please select a pickup location to continue.');
      return;
    }
    if (!user) {
      router.push('/login?next=/delivery');
      return;
    }
    setPlacingOrder(true);
    setOrderError('');
    try {
      const supabase = createClient();

      // Get user phone from profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total_amount: total,
          shipping_address: selectedLocation.address,
          pickup_location: `${selectedLocation.name} — ${selectedLocation.address}`,
          customer_phone: profile?.phone || '',
          notes: promoCode ? `Promo: ${promoCode} (${promoDiscount}% off)` : '',
        })
        .select('id')
        .single();

      if (orderError || !order) throw orderError || new Error('Failed to create order');

      // Validate product IDs exist in the database to avoid FK constraint errors
      const productIds = cartItems.map((item) => item.id).filter(Boolean);
      let validProductIds = new Set<string>();
      if (productIds.length > 0) {
        const { data: validProducts } = await supabase
          .from('products')
          .select('id')
          .in('id', productIds);
        if (validProducts) {
          validProducts.forEach((p) => validProductIds.add(p.id));
        }
      }

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: validProductIds.has(item.id) ? item.id : null,
        product_name: item.name,
        product_image: item.img || '',
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      window.dispatchEvent(new Event('cart-updated'));
      router.push(`/order-confirmation?order_id=${order.id}`);
    } catch (err: any) {
      setOrderError(err?.message || 'Failed to place order. Please try again.');
      setPlacingOrder(false);
    }
  };

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors font-medium">Home</Link>
        <Icon name="ChevronRightIcon" size={12} />
        <Link href="/cart" className="hover:text-foreground transition-colors font-medium">Cart</Link>
        <Icon name="ChevronRightIcon" size={12} />
        <span className="text-foreground font-bold">Delivery</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground">
          Choose <span className="text-primary">Pickup Location</span>
        </h1>
        <p className="text-muted-foreground mt-2">Select where you'd like to collect your order.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Location Selection */}
        <div className="lg:col-span-7 space-y-5">
          {/* Detect Location Button */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name="MapPinIcon" size={20} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-foreground mb-1">Use My Location</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Allow location access to find the nearest pickup point automatically.
                </p>
                {nearestLocation && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-3 flex items-center gap-2 text-sm">
                    <Icon name="CheckCircleIcon" size={16} className="text-green-600 flex-shrink-0" />
                    <span className="text-green-700 font-bold">Nearest: {nearestLocation.name}</span>
                  </div>
                )}
                {locationError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-3 flex items-center gap-2 text-sm">
                    <Icon name="ExclamationCircleIcon" size={16} className="text-red-500 flex-shrink-0" />
                    <span className="text-red-600">{locationError}</span>
                  </div>
                )}
                <button
                  onClick={detectLocation}
                  disabled={detectingLocation || loadingLocations}
                  className="btn-secondary !px-5 !py-2.5 !text-xs disabled:opacity-60"
                >
                  {detectingLocation ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Detecting…
                    </span>
                  ) : (
                    <>
                      <Icon name="MapPinIcon" size={14} />
                      Detect My Location
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Icon name="MagnifyingGlassIcon" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by area or location name…"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          {/* Locations List */}
          {loadingLocations ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No pickup locations found matching your search.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                const isNearest = nearestLocation?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        isSelected ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-foreground text-sm">{loc.name}</p>
                          {isNearest && (
                            <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              NEAREST
                            </span>
                          )}
                          <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                            {loc.area}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Icon name="MapPinIcon" size={12} className="flex-shrink-0" />
                          {loc.address}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Order Summary + Confirm */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 bg-card border border-border rounded-2xl p-6 shadow-warm">
            <h2 className="font-black text-foreground text-lg mb-5 uppercase tracking-wide">Order Summary</h2>

            <div className="space-y-3 mb-5">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[60%]">{item.name} × {item.quantity}</span>
                  <span className="font-bold text-foreground">{formatKES(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm mb-3">
                <span className="text-green-600 font-bold">Promo ({promoCode})</span>
                <span className="font-bold text-green-600">-{formatKES(discountAmount)}</span>
              </div>
            )}

            <div className="border-t border-border pt-4 mb-5">
              <div className="flex justify-between">
                <span className="font-black text-foreground uppercase tracking-wide">Total</span>
                <span className="text-2xl font-black text-foreground">{formatKES(total)}</span>
              </div>
            </div>

            {/* Selected Location Preview */}
            {selectedLocation ? (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Pickup Location</p>
                <p className="font-black text-foreground text-sm">{selectedLocation.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Icon name="MapPinIcon" size={11} />
                  {selectedLocation.address}
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                  <Icon name="ExclamationTriangleIcon" size={16} className="flex-shrink-0" />
                  Please select a pickup location above
                </p>
              </div>
            )}

            {orderError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
                {orderError}
              </div>
            )}

            <button
              onClick={handleConfirmOrder}
              disabled={!selectedLocation || placingOrder}
              className="btn-primary w-full justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {placingOrder ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Placing Order…
                </span>
              ) : (
                <>
                  <Icon name="LockClosedIcon" size={16} />
                  Confirm & Secure Checkout
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="LockClosedIcon" size={12} />
                SSL Secure
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Icon name="TruckIcon" size={12} />
                Pickup Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <Suspense fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        }>
          <DeliveryContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

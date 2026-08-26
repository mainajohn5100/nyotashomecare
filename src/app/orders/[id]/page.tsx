'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: string;
  pickup_location: string;
  customer_phone: string;
  notes: string;
  order_items: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/profile');
      return;
    }
    if (!user || !params.id) return;

    const fetchOrder = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', params.id as string)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setOrder(data);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [user, authLoading, params.id]);

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-background pt-20">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <Footer />
      </>
    );
  }

  if (notFound || !order) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-24 pb-16">
          <div className="max-w-2xl mx-auto px-6 py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <Icon name="ClipboardDocumentListIcon" size={36} className="text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-black text-foreground mb-3">Order Not Found</h1>
            <p className="text-muted-foreground mb-8">This order doesn't exist or you don't have access to it.</p>
            <Link href="/profile" className="btn-primary">
              <Icon name="ArrowLeftIcon" size={16} />
              Back to My Orders
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground transition-colors font-medium">Home</Link>
            <Icon name="ChevronRightIcon" size={12} />
            <Link href="/profile" className="hover:text-foreground transition-colors font-medium">My Orders</Link>
            <Icon name="ChevronRightIcon" size={12} />
            <span className="text-foreground font-bold">#{order.id.slice(0, 8).toUpperCase()}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-foreground">Order Details</h1>
              <p className="text-muted-foreground mt-1 font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <span className={`text-sm font-bold px-4 py-2 rounded-full capitalize self-start sm:self-auto ${statusColors[order.status] || 'bg-secondary text-foreground'}`}>
              {order.status}
            </span>
          </div>

          {/* Order Progress (only for non-cancelled) */}
          {order.status !== 'cancelled' && (
            <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-warm">
              <h2 className="font-black text-foreground mb-5 text-sm uppercase tracking-widest">Order Progress</h2>
              <div className="flex items-center gap-0">
                {statusSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isActive = idx === currentStepIndex;
                  return (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isCompleted ? 'bg-primary' : 'bg-secondary border-2 border-border'
                        }`}>
                          {isCompleted ? (
                            <Icon name="CheckIcon" size={14} className="text-primary-foreground" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-border" />
                          )}
                        </div>
                        <p className={`text-[10px] font-bold mt-1.5 capitalize ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step}
                        </p>
                      </div>
                      {idx < statusSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${idx < currentStepIndex ? 'bg-primary' : 'bg-border'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-warm">
            <h2 className="font-black text-foreground mb-5 text-sm uppercase tracking-widest">Items Ordered</h2>
            <div className="space-y-4">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                    <AppImage
                      src={item.product_image || '/assets/images/no_image.png'}
                      alt={item.product_name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-sm">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.quantity} × {formatKES(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-black text-foreground text-sm">{formatKES(item.total_price)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 mt-2 flex justify-between items-center">
              <span className="font-black text-foreground uppercase tracking-wide">Total</span>
              <span className="text-2xl font-black text-foreground">{formatKES(order.total_amount)}</span>
            </div>

            {order.notes && (
              <div className="mt-4 p-3 bg-secondary rounded-xl text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Note: </span>{order.notes}
              </div>
            )}
          </div>

          {/* Delivery Info */}
          <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-warm">
            <h2 className="font-black text-foreground mb-5 text-sm uppercase tracking-widest">Delivery Information</h2>
            <div className="space-y-4">
              {(order.pickup_location || order.shipping_address) && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="MapPinIcon" size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-0.5">Pickup Location</p>
                    <p className="font-bold text-foreground text-sm">{order.pickup_location || order.shipping_address}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="CalendarDaysIcon" size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-0.5">Order Date</p>
                  <p className="font-bold text-foreground text-sm">
                    {new Date(order.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="TruckIcon" size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-0.5">Estimated Ready</p>
                  <p className="font-bold text-foreground text-sm">3–5 business days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/profile" className="btn-secondary flex-1 justify-center">
              <Icon name="ArrowLeftIcon" size={16} />
              Back to My Orders
            </Link>
            <Link href="/products" className="btn-primary flex-1 justify-center">
              Continue Shopping
              <Icon name="ArrowRightIcon" size={16} />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

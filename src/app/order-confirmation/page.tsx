'use client';
import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const fetchOrder = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(id, product_name, quantity, unit_price, total_price)')
        .eq('id', orderId)
        .single();
      if (data) setOrder(data);
      setLoading(false);
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      {/* Success Icon */}
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8">
        <Icon name="CheckCircleIcon" size={52} className="text-green-500" variant="solid" />
      </div>

      <h1 className="text-4xl font-black text-foreground mb-3">Order Confirmed!</h1>
      <p className="text-muted-foreground text-lg mb-2">
        Thank you for shopping with <span className="font-bold text-foreground">Nyotas Homecare</span>.
      </p>
      <p className="text-muted-foreground mb-10">
        We've received your order and will begin processing it shortly.
      </p>

      {order && (
        <div className="bg-card border border-border rounded-3xl p-8 text-left mb-8 shadow-warm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Order ID</p>
              <p className="font-black text-foreground font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 capitalize">
              {order.status}
            </span>
          </div>

          {order.order_items && order.order_items.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Items Ordered</p>
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-bold text-foreground text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatKES(item.unit_price)}</p>
                    </div>
                    <p className="font-black text-foreground">{formatKES(item.total_price)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4 flex justify-between items-center">
            <span className="font-black text-foreground uppercase tracking-wide">Total</span>
            <span className="text-2xl font-black text-foreground">{formatKES(order.total_amount)}</span>
          </div>

          <div className="mt-4 p-4 bg-secondary rounded-2xl">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="TruckIcon" size={16} className="text-primary flex-shrink-0" />
              <span>Estimated delivery: <strong className="text-foreground">3–5 business days</strong></span>
            </div>
          </div>
        </div>
      )}

      {!order && !orderId && (
        <div className="bg-card border border-border rounded-3xl p-8 mb-8">
          <p className="text-muted-foreground">Your order has been placed successfully.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/products" className="btn-primary">
          Continue Shopping
          <Icon name="ArrowRightIcon" size={18} />
        </Link>
        <Link href="/profile" className="btn-secondary">
          <Icon name="ClipboardDocumentListIcon" size={18} />
          View My Orders
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
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
          <OrderConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

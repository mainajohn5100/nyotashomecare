import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartClient from '@/app/cart/components/CartClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Cart — HomeVibe',
  description: 'Review your HomeVibe cart, apply promo codes, and complete your purchase. Free shipping on orders over $75.',
  alternates: { canonical: '/cart' },
};

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-background">
        <CartClient />
      </main>
      <Footer />
    </>
  );
}
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartClient from '@/app/cart/components/CartClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Cart — Nyotas Homecare',
  description: 'Review your cart, and complete your purchase. Most orders arrive within 24-48 hours.',
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
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductsClient from '@/app/products/components/ProductsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All Products — HomeVibe',
  description: 'Browse 265+ home goods including furniture, décor, kitchenware, and bedroom essentials. Filter by category, price, and style. Free shipping on $75+.',
  alternates: { canonical: '/products' },
};

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <ProductsClient />
      </main>
      <Footer />
    </>
  );
}
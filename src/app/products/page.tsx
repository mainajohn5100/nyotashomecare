import React, { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductsClient from '@/app/products/components/ProductsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All Products — Nyotas Homecare',
  description: 'Browse home goods including furniture, décor, kitchenware, and bedroom essentials.',
  alternates: { canonical: '/products' },
};

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <Suspense fallback={null}>
          <ProductsClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
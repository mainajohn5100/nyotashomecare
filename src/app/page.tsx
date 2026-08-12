import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/app/components/HeroSection';
import CategoryBento from '@/app/components/CategoryBento';
import FeaturedProducts from '@/app/components/FeaturedProducts';
import BrandStory from '@/app/components/BrandStory';
import TestimonialsSection from '@/app/components/TestimonialsSection';
import ContactSection from '@/app/components/ContactSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HomeVibe — Bold Home Goods That Transform Your Space',
  description: 'Shop HomeVibe for furniture, décor, kitchenware, and everyday home goods. Bold design, real quality — pieces that make your space feel intentional.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <CategoryBento />
        <FeaturedProducts />
        <BrandStory />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
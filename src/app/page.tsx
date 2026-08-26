import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/app/components/HeroSection';
import FeaturedProducts from '@/app/components/FeaturedProducts';
import CategoryScrollRows from '@/app/components/CategoryScrollRows';
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
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Nyotas Homecare',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://homevibe5370.builtwithrocket.new',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://homevibe5370.builtwithrocket.new'}/assets/images/app_logo.png`,
    description: 'Bold home goods — furniture, décor, kitchenware, and everyday home essentials in Kenya.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Nairobi',
      addressCountry: 'KE',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'English',
    },
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Header />
      <main>
        <HeroSection />
        <FeaturedProducts />
        <CategoryScrollRows />
        <BrandStory />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
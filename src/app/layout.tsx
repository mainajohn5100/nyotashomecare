import React from 'react';
import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import Script from 'next/script';
import { AuthProvider } from '@/contexts/AuthContext';
import WhatsAppBubble from '@/components/WhatsAppBubble';

import '../styles/tailwind.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Nyotas Homecare — Essentials for Every Home',
  description: 'Shop Nyotas Homecare for décor, kitchenware, and everyday home goods. Bold design, real quality — find pieces that make your space feel intentional.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
  openGraph: {
    title: 'Nyotas Homecare — Essentials for Every Home',
    description: 'Decor, Kitchenware and everything you need to make your house a home.',
    images: [{ url: '/assets/images/app_logo.png', width: 1200, height: 630 }],
  }, 
  verification: {
    google: 'swDTo4jcp9HHuF5Bcmcw0qa9U5C3iDfcbr6ifLaClEY',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QNNZPT3ZE3"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-QNNZPT3ZE3');
          `}
        </Script>
      </head>
      <body className={dmSans.className}>
        <AuthProvider>
          {children}
          <WhatsAppBubble />
        </AuthProvider>

        <script type="module" async src="https://static.rocket.new/rocket-web.js?_cfg=https%3A%2F%2Fhomevibe5370back.builtwithrocket.new&_be=https%3A%2F%2Fappanalytics.rocket.new&_v=0.1.20" />
        <script type="module" defer src="https://static.rocket.new/rocket-shot.js?v=0.0.2" /></body>
    </html>
  );
}
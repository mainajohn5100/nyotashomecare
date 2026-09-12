'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const values = [
  { icon: 'SparklesIcon', label: 'Bold Design', desc: 'Every piece is chosen for visual impact and lasting style.' },
  { icon: 'ShieldCheckIcon', label: 'Real Quality', desc: 'We test every product before it reaches your doorstep.' },
  { icon: 'TruckIcon', label: 'Fast Delivery', desc: 'Countrywide delivery . Most orders arrive within 24-48 hours.' }];


export default function BrandStory() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.story-reveal');
            items.forEach((item, i) => {
              setTimeout(() => {
                (item as HTMLElement).style.opacity = '1';
                (item as HTMLElement).style.filter = 'blur(0)';
                (item as HTMLElement).style.transform = 'translateY(0)';
              }, i * 150);
            });
          }
        });
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" className="py-24 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div ref={sectionRef} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">

          {/* Left: Image stack */}
          <div className="lg:col-span-5 relative">
            <div
              className="story-reveal relative z-10 img-mask-rounded overflow-hidden aspect-[4/5] shadow-warm"
              style={{ opacity: 0, filter: 'blur(8px)', transform: 'translateY(20px)', transition: 'opacity 0.7s ease, filter 0.7s ease, transform 0.7s cubic-bezier(0.23,1,0.32,1)' }}>

              <AppImage
                src="https://img.rocket.new/generatedImages/rocket_gen_img_1d7da0faf-1772053875727.png"
                alt="Warm sunlit kitchen interior with neatly arranged cookware, terracotta tiles, and fresh herbs on the countertop"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 42vw" />

            </div>

            {/* Floating stat card */}
            <div
              className="story-reveal absolute -bottom-6 -right-4 lg:-right-8 z-20 bg-card border border-border p-6 rounded-2xl shadow-warm"
              style={{ opacity: 0, filter: 'blur(8px)', transform: 'translateY(20px)', transition: 'opacity 0.7s ease, filter 0.7s ease, transform 0.7s cubic-bezier(0.23,1,0.32,1)' }}>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-3xl font-black text-foreground">2019</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Founded</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-primary">265+</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Products</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-foreground">1.2k+</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Customers</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-primary">4.9★</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Avg Rating</p>
                </div>
              </div>
            </div>

            {/* Decorative blob */}
            <div className="absolute -top-8 -left-8 w-48 h-48 bg-primary opacity-10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Right: Content */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div
              className="story-reveal"
              style={{ opacity: 0, filter: 'blur(8px)', transform: 'translateY(20px)', transition: 'opacity 0.7s ease, filter 0.7s ease, transform 0.7s cubic-bezier(0.23,1,0.32,1)' }}>

              <p className="section-label mb-4">Our Story</p>
              <h2 className="text-display text-foreground mb-6">
                We are{' '}
                <span className="text-primary border-b-4 border-primary border-dotted">rethinking</span>{' '}
                home goods to be more intentional, more beautiful, and always{' '}
                <span className="text-primary border-b-4 border-primary border-dotted">worth it.</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Nyotas Homecare was born from a simple frustration: too many home stores sold the same forgettable stuff. We curate pieces with real design intention: furniture that holds up, décor that sparks joy, kitchenware you actually reach for. Every product earns its place in our store.
              </p>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
              {values.map((val, i) =>
                <div
                  key={val.label}
                  className="story-reveal flex flex-col gap-3 p-5 bg-secondary rounded-2xl border border-border"
                  style={{ opacity: 0, filter: 'blur(8px)', transform: 'translateY(20px)', transition: 'opacity 0.7s ease, filter 0.7s ease, transform 0.7s cubic-bezier(0.23,1,0.32,1)', transitionDelay: `${(i + 3) * 0.15}s` }}>

                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon name={val.icon as Parameters<typeof Icon>[0]['name']} size={20} className="text-primary" />
                  </div>
                  <h4 className="font-black text-foreground text-base">{val.label}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{val.desc}</p>
                </div>
              )}
            </div>

            <div
              className="story-reveal flex flex-col sm:flex-row gap-4 mt-2"
              style={{ opacity: 0, filter: 'blur(8px)', transform: 'translateY(20px)', transition: 'opacity 0.7s ease, filter 0.7s ease, transform 0.7s cubic-bezier(0.23,1,0.32,1)' }}>

              <Link href="/products" className="btn-primary">
                Shop The Collection
                <Icon name="ArrowRightIcon" size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>);

}
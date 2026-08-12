'use client';
import React, { useEffect, useRef, useState } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  img: string;
  alt: string;
  metric: string;
  metricLabel: string;
  metricTarget: number;
  accentColor: string;
  borderColor: string;
}

const testimonials: Testimonial[] = [
{
  id: 1,
  quote: "I've redecorated three rooms using HomeVibe and every single piece has been exactly what I expected — quality packaging, fast shipping, and the products look even better in person.",
  name: 'Sarah Chen',
  role: 'Interior Design Enthusiast · San Francisco, CA',
  img: "https://images.unsplash.com/photo-1604979093905-73791e4f75f5",
  alt: 'Young woman with brown hair smiling outdoors in natural light, warm background',
  metric: '4.9',
  metricLabel: 'Avg Product Rating',
  metricTarget: 4.9,
  accentColor: 'border-primary',
  borderColor: 'border-l-primary'
},
{
  id: 2,
  quote: "The Linen Cloud Sofa changed my entire living room vibe. My guests always ask where I got it. Two years in, it still looks brand new. This is what quality actually feels like.",
  name: 'Marcus Williams',
  role: 'Homeowner · Austin, TX',
  img: "https://img.rocket.new/generatedImages/rocket_gen_img_164e967f5-1772297494591.png",
  alt: 'Young man with a warm smile wearing a casual shirt, bright indoor setting',
  metric: '12k+',
  metricLabel: 'Happy Customers',
  metricTarget: 12000,
  accentColor: 'border-green-500',
  borderColor: 'border-l-green-500'
}];


function useCounter(target: number, isVisible: boolean, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    const start = performance.now();
    const duration = 2000;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {if (rafRef.current) cancelAnimationFrame(rafRef.current);};
  }, [isVisible, target, decimals]);

  return value;
}

function TestimonialRow({ testimonial, reverse, visible }: {testimonial: Testimonial;reverse: boolean;visible: boolean;}) {
  const isDecimal = testimonial.metricTarget < 100;
  const count = useCounter(testimonial.metricTarget, visible, isDecimal ? 1 : 0);

  const displayValue = testimonial.metricTarget >= 1000 ?
  `${Math.round(count / 1000)}k+` :
  isDecimal ?
  count.toFixed(1) :
  count.toFixed(0);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20 items-center pb-16 mb-16 border-b border-border last:border-b-0 last:pb-0 last:mb-0`}>
      {/* Metric block */}
      <div className={`${reverse ? 'lg:order-1' : 'lg:order-3'}`}>
        <div className={`p-8 border-l-4 ${testimonial.borderColor} bg-secondary rounded-r-2xl`}>
          <p className="text-5xl lg:text-6xl font-black text-foreground mb-2">{displayValue}</p>
          <p className="font-black text-foreground uppercase tracking-widest text-xs mb-1">{testimonial.metricLabel}</p>
          <p className="text-muted-foreground text-sm">Verified by customer data</p>
        </div>
      </div>

      {/* Content block */}
      <div className={`flex flex-col sm:flex-row gap-8 lg:col-span-2 ${reverse ? 'lg:order-2 lg:border-l lg:pl-12' : 'lg:order-1 lg:pr-12'} border-border items-start`}>
        <AppImage
          src={testimonial.img}
          alt={testimonial.alt}
          width={200}
          height={240}
          className="w-full max-w-[180px] h-[220px] rounded-2xl object-cover shadow-warm flex-shrink-0 ring-1 ring-border" />
        
        <div className="flex flex-col justify-between gap-6 flex-1">
          <div className="flex">
            {[...Array(5)].map((_, i) =>
            <Icon key={i} name="StarIcon" variant="solid" size={16} className="text-primary" />
            )}
          </div>
          <blockquote className="text-xl text-foreground leading-relaxed font-medium">
            "{testimonial.quote}"
          </blockquote>
          <div>
            <p className="text-base font-black text-foreground">{testimonial.name}</p>
            <p className="text-sm text-primary uppercase tracking-widest font-bold mt-0.5">{testimonial.role}</p>
          </div>
        </div>
      </div>
    </div>);

}

export default function TestimonialsSection() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {if (entry.isIntersecting) setVisible(true);},
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-secondary">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-20">
          <p className="section-label mb-4">Real Homes, Real Stories</p>
          <h2 className="text-display text-foreground">
            Customers Who<br />
            <span className="text-primary">Love Their Spaces</span>
          </h2>
        </div>

        <div className="flex flex-col">
          {testimonials.map((t, i) =>
          <TestimonialRow key={t.id} testimonial={t} reverse={i % 2 === 1} visible={visible} />
          )}
        </div>
      </div>
    </section>);

}
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface HeroSlide {
  id: string;
  sort_order: number;
  headline_line1: string;
  headline_line2: string;
  label: string;
  tag: string;
  price_from: string;
  images: string[];
  category_id: string | null;
  is_active: boolean;
  categories?: { name: string; slug: string } | null;
}

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: '0',
    sort_order: 0,
    headline_line1: 'Living Room',
    headline_line2: 'Reinvented',
    label: 'New Collection',
    tag: 'Furniture',
    price_from: 'From KSh 38,870',
    images: ['https://images.unsplash.com/photo-1724780027758-623777e0488b'],
    category_id: null,
    is_active: true,
  },
  {
    id: '1',
    sort_order: 1,
    headline_line1: 'Kitchen',
    headline_line2: 'Elevated',
    label: 'Chef Favorites',
    tag: 'Kitchenware',
    price_from: 'From KSh 6,370',
    images: ['https://images.unsplash.com/photo-1575882711815-7ac675ec1ebd'],
    category_id: null,
    is_active: true,
  },
  {
    id: '2',
    sort_order: 2,
    headline_line1: 'Bedroom',
    headline_line2: 'Sanctuary',
    label: 'Rest Well',
    tag: 'Bedroom',
    price_from: 'From KSh 16,770',
    images: ['https://img.rocket.new/generatedImages/rocket_gen_img_1a7c50e83-1772063715990.png'],
    category_id: null,
    is_active: true,
  },
];

export default function HeroSection() {
  const [slides, setSlides] = useState<HeroSlide[]>(FALLBACK_SLIDES);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [floatVisible, setFloatVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const imgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchSlides = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('hero_settings')
        .select('*, categories(name, slug)')
        .eq('is_active', true)
        .order('sort_order')
        .limit(6);
      if (data && data.length > 0) {
        setSlides(data);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setFloatVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Auto-cycle images for active slide
  useEffect(() => {
    if (imgIntervalRef.current) clearInterval(imgIntervalRef.current);
    const currentSlide = slides[activeIdx];
    if (!currentSlide || currentSlide.images.length <= 1) {
      setActiveImgIdx(0);
      return;
    }
    setActiveImgIdx(0);
    imgIntervalRef.current = setInterval(() => {
      setActiveImgIdx((prev) => (prev + 1) % currentSlide.images.length);
    }, 2500);
    return () => {
      if (imgIntervalRef.current) clearInterval(imgIntervalRef.current);
    };
  }, [activeIdx, slides]);

  const handleTitleHover = (idx: number) => {
    if (idx === activeIdx || isTransitioning) return;
    setIsTransitioning(true);

    if (imgRef.current) {
      imgRef.current.style.opacity = '0';
      imgRef.current.style.transform = 'scale(1.08)';
    }

    setTimeout(() => {
      setActiveIdx(idx);
      setActiveImgIdx(0);
      if (imgRef.current) {
        imgRef.current.style.transition = 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.23,1,0.32,1)';
        imgRef.current.style.opacity = '1';
        imgRef.current.style.transform = 'scale(1)';
      }
      setIsTransitioning(false);
    }, 280);
  };

  const active = slides[activeIdx] || FALLBACK_SLIDES[0];
  const currentImg = active.images?.[activeImgIdx] || active.images?.[0] || '/assets/images/no_image.png';
  const categoryHref = active.categories?.slug
    ? `/collections?category=${active.categories.slug}`
    : '/products';

  return (
    <section className="relative h-screen max-h-screen pt-16 bg-background overflow-hidden flex items-center">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary opacity-60 rounded-bl-[4rem] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary opacity-5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center py-4 lg:py-6">

          {/* Left: Staggered Titles */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* <div className="section-label mb-1">Nyotas Homecare 2026</div> */}

            <div className="flex flex-col gap-2" role="list">
              {slides.map((item, idx) => (
                <div
                  key={item.id}
                  role="listitem"
                  onMouseEnter={() => handleTitleHover(idx)}
                  onClick={() => handleTitleHover(idx)}
                  className={`hero-title-item group cursor-pointer select-none ${activeIdx === idx ? 'active' : ''}`}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-hero-xl text-foreground font-black uppercase leading-none tracking-tight">
                      {item.headline_line1}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span
                      className="text-hero-xl font-black uppercase leading-none tracking-tight"
                      style={{ color: activeIdx === idx ? 'var(--primary)' : 'var(--foreground)' }}
                    >
                      {item.headline_line2}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground text-base max-w-sm leading-relaxed mt-2">
              Curated home goods designed to make every room feel alive. Bold pieces, real quality, delivered to your door.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link href="/products" className="btn-primary">
                Shop Now
                <Icon name="ArrowRightIcon" size={18} />
              </Link>
              <Link href="/#about" className="btn-secondary">
                Our Story
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex items-center gap-5 mt-3 pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-xl font-black text-foreground">12k+</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Happy Homes</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-xl font-black text-foreground">4.9★</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Avg Rating</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-xl font-black text-foreground">Fast</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Countrywide Delivery</p>
              </div>
            </div>
          </div>

          {/* Right: Image */}
          <div className="lg:col-span-7 relative hidden lg:block">
            <div
              className="img-mask-rounded overflow-hidden aspect-[5/4] relative shadow-warm"
              ref={imgRef}
              style={{ transition: 'opacity 0.3s ease, transform 0.3s ease' }}
            >
              <AppImage
                src={currentImg}
                alt={`${active.headline_line1} ${active.headline_line2}`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
              {/* Image dots indicator */}
              {active.images.length > 1 && (
                <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
                  {active.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImgIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImgIdx ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Floating Product Card */}
            <div
              className={`absolute bottom-4 left-4 lg:-left-10 z-20 bg-card backdrop-blur-xl border border-border p-4 rounded-2xl shadow-warm max-w-[200px] transition-all duration-700 ${floatVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{active.label}</span>
              </div>
              <p className="text-sm font-black text-foreground leading-tight mb-1">
                {active.tag} Collection
              </p>
              <p className="text-xs font-bold text-primary">{active.price_from}</p>
              <Link
                href={categoryHref}
                className="mt-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors"
              >
                Explore <Icon name="ArrowRightIcon" size={12} />
              </Link>
            </div>

            {/* Floating badge top-right */}
            <div className="absolute top-4 right-4 z-20 animate-float-slow">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-primary-glow">
                New Arrivals
              </div>
            </div>
          </div>

          {/* Mobile image */}
          <div className="lg:hidden relative">
            <div
              className="img-mask-rounded overflow-hidden aspect-[4/3] relative shadow-warm"
              style={{ transition: 'opacity 0.3s ease, transform 0.3s ease' }}
            >
              <AppImage
                src={currentImg}
                alt={`${active.headline_line1} ${active.headline_line2}`}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const heroData = [
{
  id: 0,
  headline: ['Living Room', 'Reinvented'],
  label: 'New Collection',
  img: "https://images.unsplash.com/photo-1724780027758-623777e0488b",
  imgAlt: 'Bright modern living room with warm neutral tones, plush sofa, and large windows letting in natural light',
  tag: 'Furniture',
  price: 'From $299'
},
{
  id: 1,
  headline: ['Kitchen', 'Elevated'],
  label: 'Chef Favorites',
  img: "https://images.unsplash.com/photo-1575882711815-7ac675ec1ebd",
  imgAlt: 'Bright open kitchen with terracotta accents, copper cookware hanging on wall, and clean white countertops',
  tag: 'Kitchenware',
  price: 'From $49'
},
{
  id: 2,
  headline: ['Bedroom', 'Sanctuary'],
  label: 'Rest Well',
  img: "https://img.rocket.new/generatedImages/rocket_gen_img_1a7c50e83-1772063715990.png",
  imgAlt: 'Serene bedroom with linen bedding in warm cream tones, wooden nightstand, and soft morning light',
  tag: 'Bedroom',
  price: 'From $129'
}];


export default function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgSrc, setImgSrc] = useState(heroData[0].img);
  const [imgAlt, setImgAlt] = useState(heroData[0].imgAlt);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [floatVisible, setFloatVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setFloatVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleTitleHover = (idx: number) => {
    if (idx === activeIdx || isTransitioning) return;
    setIsTransitioning(true);
    setActiveIdx(idx);

    if (imgRef.current) {
      imgRef.current.style.opacity = '0';
      imgRef.current.style.transform = 'scale(1.08)';
    }

    setTimeout(() => {
      setImgSrc(heroData[idx].img);
      setImgAlt(heroData[idx].imgAlt);
      if (imgRef.current) {
        imgRef.current.style.transition = 'opacity 0.55s ease, transform 0.55s cubic-bezier(0.23,1,0.32,1)';
        imgRef.current.style.opacity = '1';
        imgRef.current.style.transform = 'scale(1)';
      }
      setIsTransitioning(false);
    }, 280);
  };

  const active = heroData[activeIdx];

  return (
    <section className="relative min-h-screen pt-20 bg-background overflow-hidden flex items-center">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary opacity-60 rounded-bl-[4rem] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary opacity-5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center py-12 lg:py-20">

          {/* Left: Staggered Titles */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="section-label mb-2">HomeVibe 2026</div>

            <div className="flex flex-col gap-3" role="list">
              {heroData.map((item, idx) =>
              <div
                key={item.id}
                role="listitem"
                onMouseEnter={() => handleTitleHover(idx)}
                onClick={() => handleTitleHover(idx)}
                className={`hero-title-item group cursor-pointer select-none ${activeIdx === idx ? 'active' : ''}`}>
                
                  <div className="flex items-baseline gap-3">
                    <span className="text-hero-xl text-foreground font-black uppercase leading-none tracking-tight">
                      {item.headline[0]}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-hero-xl font-black uppercase leading-none tracking-tight"
                  style={{ color: activeIdx === idx ? 'var(--primary)' : 'var(--foreground)' }}>
                      {item.headline[1]}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-muted-foreground text-lg max-w-sm leading-relaxed mt-4">
              Curated home goods designed to make every room feel alive. Bold pieces, real quality, delivered to your door.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link href="/products" className="btn-primary">
                Shop Now
                <Icon name="ArrowRightIcon" size={18} />
              </Link>
              <Link href="/#about" className="btn-secondary">
                Our Story
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-black text-foreground">12k+</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Happy Homes</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-black text-foreground">4.9★</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Avg Rating</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-black text-foreground">Free</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Shipping $75+</p>
              </div>
            </div>
          </div>

          {/* Right: Image */}
          <div className="lg:col-span-7 relative">
            <div
              className="img-mask-rounded overflow-hidden aspect-[4/4] lg:aspect-[5/5] relative shadow-warm"
              ref={imgRef}
              style={{ transition: 'opacity 0.3s ease, transform 0.3s ease' }}>
              
              <AppImage
                src={imgSrc}
                alt={imgAlt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 58vw" />
              
            </div>

            {/* Floating Product Card */}
            <div
              className={`absolute bottom-6 left-4 lg:-left-10 z-20 bg-card/95 backdrop-blur-xl border border-border p-5 rounded-2xl shadow-warm max-w-[220px] transition-all duration-700 ${
              floatVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`
              }>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{active.label}</span>
              </div>
              <p className="text-base font-black text-foreground leading-tight mb-1">
                {active.tag} Collection
              </p>
              <p className="text-sm font-bold text-primary">{active.price}</p>
              <Link
                href="/products"
                className="mt-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors">
                
                Explore <Icon name="ArrowRightIcon" size={12} />
              </Link>
            </div>

            {/* Floating badge top-right */}
            <div className="absolute top-6 right-6 z-20 animate-float-slow">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-primary-glow">
                New Arrivals
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}
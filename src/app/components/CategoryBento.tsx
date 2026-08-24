'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const categories = [
{
  id: 'living',
  name: 'Living Room',
  tagline: 'Where life happens',
  count: '48 pieces',
  img: "https://images.unsplash.com/photo-1721902024689-c1d1bff5433d",
  alt: 'Bright airy living room with contemporary furniture, natural light streaming through tall windows, and warm wooden accents',
  colSpan: 'md:col-span-2',
  rowSpan: '',
  height: 'h-72 md:h-80',
  accent: 'bg-primary'
},
{
  id: 'kitchen',
  name: 'Kitchen',
  tagline: 'Cook with intention',
  count: '62 pieces',
  img: "https://images.unsplash.com/photo-1561554854-ae60cb36ebe9",
  alt: 'Modern kitchen with clean lines, terracotta tile backsplash, and organized copper cookware on open shelves',
  colSpan: 'md:col-span-1',
  rowSpan: '',
  height: 'h-72 md:h-80',
  accent: 'bg-secondary-foreground'
},
{
  id: 'bedroom',
  name: 'Bedroom',
  tagline: 'Rest and restore',
  count: '35 pieces',
  img: "https://img.rocket.new/generatedImages/rocket_gen_img_1c5584ac7-1779535992329.png",
  alt: 'Calm bedroom sanctuary with linen pillows, soft warm lighting, and minimalist wooden furniture in neutral tones',
  colSpan: 'md:col-span-1',
  rowSpan: '',
  height: 'h-72 md:h-80',
  accent: 'bg-muted-foreground'
},
{
  id: 'decor',
  name: 'Décor Accents',
  tagline: 'The finishing touch',
  count: '120+ pieces',
  img: "https://images.unsplash.com/photo-1684129593661-a824cdd37f2e",
  alt: 'Artful home décor arrangement with ceramic vases, woven textiles, and sculptural objects on a clean white shelf in bright natural light',
  colSpan: 'md:col-span-2',
  rowSpan: '',
  height: 'h-72 md:h-80',
  accent: 'bg-primary'
}];


export default function CategoryBento() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll('.bento-reveal');
            cards.forEach((card, i) => {
              setTimeout(() => {
                (card as HTMLElement).style.opacity = '1';
                (card as HTMLElement).style.transform = 'translateY(0)';
              }, i * 120);
            });
          }
        });
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <p className="section-label mb-3">Shop by Room</p>
            <h2 className="text-display text-foreground">
              Every Space,<br />
              <span className="text-primary">Covered.</span>
            </h2>
          </div>
          <Link href="/collections" className="btn-ghost group self-start sm:self-auto">
            View All Collections
            <Icon name="ArrowRightIcon" size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* BENTO GRID
           Row 1: [col-1..2: Living Room cs-2] [col-3: Kitchen cs-1]
           Row 2: [col-1: Bedroom cs-1] [col-2..3: Décor Accents cs-2]
           4/4 cards placed ✓
          */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat) =>
          <Link
            key={cat.id}
            href="/products"
            className={`bento-reveal bento-card-hover relative overflow-hidden rounded-3xl ${cat.colSpan} ${cat.height} group block`}
            style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.23,1,0.32,1)' }}>
            
              {/* Image */}
              <AppImage
              src={cat.img}
              alt={cat.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
            

              {/* Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="flex justify-end">
                  <span className={`${cat.accent} text-primary-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full`}>
                    {cat.count}
                  </span>
                </div>
                <div>
                  <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest mb-1">{cat.tagline}</p>
                  <h3 className="text-primary-foreground text-2xl lg:text-3xl font-black tracking-tight">{cat.name}</h3>
                  <div className="mt-3 flex items-center gap-2 text-primary-foreground/80 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Shop Now <Icon name="ArrowRightIcon" size={14} />
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>);

}
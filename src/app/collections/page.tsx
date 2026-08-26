'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  image_url: string;
  images: string[] | null;
  badge: string;
  rating: number;
  review_count: number;
  category_id: string | null;
  categories?: {name: string;slug: string;} | null;
}

function formatPrice(kes: number): string {
  return `KSh ${kes.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

const categoryImages: Record<string, {img: string;alt: string;tagline: string;accent: string;}> = {
  'living-room': {
    img: "https://images.unsplash.com/photo-1722649935747-ea4ea9e80e68",
    alt: 'Bright airy living room with contemporary furniture and warm wooden accents',
    tagline: 'Where life happens',
    accent: 'bg-primary'
  },
  kitchen: {
    img: 'https://images.unsplash.com/photo-1561554854-ae60cb36ebe9',
    alt: 'Modern kitchen with clean lines and organized copper cookware on open shelves',
    tagline: 'Cook with intention',
    accent: 'bg-secondary-foreground'
  },
  bedroom: {
    img: "https://images.unsplash.com/photo-1688383454669-9f5cc5991778",
    alt: 'Calm bedroom sanctuary with linen pillows and minimalist wooden furniture',
    tagline: 'Rest and restore',
    accent: 'bg-muted-foreground'
  },
  'decor-accents': {
    img: "https://img.rocket.new/generatedImages/rocket_gen_img_17a95aa2a-1772869403387.png",
    alt: 'Artful home décor arrangement with ceramic vases and woven textiles',
    tagline: 'The finishing touch',
    accent: 'bg-primary'
  }
};

const defaultCategoryMeta = {
  img: "https://img.rocket.new/generatedImages/rocket_gen_img_119bd61c1-1772197548040.png",
  alt: 'Home goods collection',
  tagline: 'Explore the collection',
  accent: 'bg-primary'
};

interface BentoCategoryCardProps {
  category: Category;
  productCount: number;
  colSpan: string;
  height: string;
  isHighlighted: boolean;
}

function BentoCategoryCard({ category, productCount, colSpan, height, isHighlighted }: BentoCategoryCardProps) {
  const meta = categoryImages[category.slug] || defaultCategoryMeta;
  const imgSrc = category.image_url || meta.img;

  return (
    <Link
      href={`/collections/${category.slug}`}
      className={`bento-card-hover relative overflow-hidden rounded-3xl ${colSpan} ${height} group block ${isHighlighted ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      
      <AppImage
        src={imgSrc}
        alt={meta.alt}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
      
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        <div className="flex justify-end">
          <span className={`${meta.accent} text-primary-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full`}>
            {productCount > 0 ? `${productCount} pieces` : 'View all'}
          </span>
        </div>
        <div>
          <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest mb-1">{meta.tagline}</p>
          <h3 className="text-primary-foreground text-2xl lg:text-3xl font-black tracking-tight">{category.name}</h3>
          {category.description &&
          <p className="text-primary-foreground/60 text-xs mt-1 line-clamp-1">{category.description}</p>
          }
          <div className="mt-3 flex items-center gap-2 text-primary-foreground/80 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Shop Now <Icon name="ArrowRightIcon" size={14} />
          </div>
        </div>
      </div>
    </Link>);

}

function CollectionsContent() {
  const searchParams = useSearchParams();
  const highlightSlug = searchParams.get('category');
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCountByCategory, setProductCountByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: cats } = await supabase.
      from('categories').
      select('*').
      eq('is_active', true).
      order('sort_order');

      if (cats && cats.length > 0) {
        setCategories(cats);
        const { data: products } = await supabase.
        from('products').
        select('category_id').
        eq('is_active', true);

        if (products) {
          const counts: Record<string, number> = {};
          for (const cat of cats) {
            counts[cat.id] = products.filter((p) => p.category_id === cat.id).length;
          }
          setProductCountByCategory(counts);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Animate bento cards on mount
  useEffect(() => {
    if (loading || !sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll('.bento-reveal');
    cards.forEach((card, i) => {
      setTimeout(() => {
        (card as HTMLElement).style.opacity = '1';
        (card as HTMLElement).style.transform = 'translateY(0)';
      }, i * 120);
    });
  }, [loading, categories]);

  // Bento layout: alternate col spans for visual interest
  const getColSpan = (index: number, total: number) => {
    if (total <= 2) return 'md:col-span-3';
    if (total === 3) {
      if (index === 0) return 'md:col-span-2';
      return 'md:col-span-1';
    }
    // 4+ items: alternate 2-1, 1-2 pattern
    const row = Math.floor(index / 2);
    const posInRow = index % 2;
    if (row % 2 === 0) {
      return posInRow === 0 ? 'md:col-span-2' : 'md:col-span-1';
    } else {
      return posInRow === 0 ? 'md:col-span-1' : 'md:col-span-2';
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20">
        {/* Hero */}
        <div className="bg-secondary border-b border-border py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground transition-colors font-medium">Home</Link>
              <Icon name="ChevronRightIcon" size={12} />
              <span className="text-foreground font-bold">Collections</span>
            </nav>
            <h1 className="text-display text-foreground mb-3">
              Every Space,<br />
              <span className="text-primary">Covered.</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Explore our curated collections of home goods, each thoughtfully designed to transform your living spaces.
            </p>
          </div>
        </div>

        {loading ?
        <div className="flex items-center justify-center py-32">
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div> :
        categories.length === 0 ?
        <div className="flex flex-col items-center justify-center py-32 text-center px-6">
            <Icon name="ArchiveBoxIcon" size={48} className="text-muted-foreground mb-4" />
            <h2 className="text-xl font-black text-foreground mb-2">No Collections Yet</h2>
            <p className="text-muted-foreground mb-6">Collections will appear here once added from the admin panel.</p>
            <Link href="/products" className="btn-primary">Browse All Products</Link>
          </div> :

        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
            <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((cat, index) =>
            <div
              key={cat.id}
              className={`bento-reveal ${getColSpan(index, categories.length)}`}
              style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.23,1,0.32,1)' }}>
              
                  <BentoCategoryCard
                category={cat}
                productCount={productCountByCategory[cat.id] || 0}
                colSpan=""
                height="h-72 md:h-80"
                isHighlighted={highlightSlug === cat.slug} />
              
                </div>
            )}
            </div>
          </div>
        }
      </main>
      <Footer />
    </>);

}

export default function CollectionsPage() {
  return (
    <Suspense fallback={
    <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-background pt-20">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <Footer />
      </>
    }>
      <CollectionsContent />
    </Suspense>);

}
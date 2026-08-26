'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price?: number | null;
  rating: number;
  review_count: number;
  image_url: string;
  images?: string[] | null;
  badge?: string;
  is_featured?: boolean;
  categories?: { name: string; slug: string } | null;
}

function formatPrice(kes: number): string {
  return `KSh ${kes.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

function ProductCard({ product, onAddToCart, isLoggedIn, onLoginRequired }: ProductCardProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    setAdded(true);
    onAddToCart(product);
    setTimeout(() => setAdded(false), 1800);
  };

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const displayImg = (product.images && product.images.length > 0) ? product.images[0] : product.image_url;

  return (
    <Link href={`/products/${product.slug}`} className="product-card group relative flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-warm hover:shadow-lg transition-shadow duration-300">
      <div className="relative overflow-hidden aspect-[4/3] bg-secondary">
        <AppImage
          src={displayImg || '/assets/images/no_image.png'}
          alt={product.name}
          fill
          className="product-img object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
        <div className="product-card-overlay absolute inset-0 bg-foreground/20 flex items-center justify-center">
          <button
            onClick={handleAdd}
            className={`px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-full transition-all duration-200 shadow-lg ${
              added ? 'bg-green-500 text-white scale-95' : 'bg-card text-foreground hover:bg-primary hover:text-primary-foreground scale-100'
            }`}>
            {added ? '✓ Added!' : 'Add to Cart'}
          </button>
        </div>
        {product.badge && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
            {product.badge}
          </div>
        )}
        {discount && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
            -{discount}%
          </div>
        )}
      </div>
      <div className="p-2.5 sm:p-3 flex flex-col gap-1 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{product.categories?.name || ''}</p>
        <h3 className="text-xs sm:text-sm font-bold text-foreground leading-tight line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Icon
                key={i}
                name="StarIcon"
                variant={i < Math.floor(product.rating) ? 'solid' : 'outline'}
                size={10}
                className={i < Math.floor(product.rating) ? 'text-primary' : 'text-border'} />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">({product.review_count})</span>
        </div>
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          <span className="text-sm sm:text-base font-black text-foreground">{formatPrice(product.price)}</span>
          {product.original_price && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartAdded, setCartAdded] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFeatured = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(8);
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        // Fallback: show any active products if none are featured
        const { data: fallback } = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8);
        if (fallback) setProducts(fallback);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.product-reveal');
            items.forEach((item, i) => {
              setTimeout(() => {
                (item as HTMLElement).style.opacity = '1';
                (item as HTMLElement).style.transform = 'translateY(0)';
              }, i * 80);
            });
          }
        });
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleAddToCart = (product: Product) => {
    setCartAdded(product.name);
    setTimeout(() => setCartAdded(null), 2000);
  };

  const handleLoginRequired = () => {
    setShowLoginPrompt(true);
    setTimeout(() => setShowLoginPrompt(false), 3000);
  };

  return (
    <section ref={sectionRef} className="py-24 bg-secondary">
      {showLoginPrompt && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-5 py-3 rounded-full shadow-lg flex items-center gap-3 text-sm font-bold">
          <Icon name="LockClosedIcon" size={16} />
          <Link href="/login" className="underline">Sign in</Link> to add items to cart
        </div>
      )}
      {cartAdded && (
        <div className="fixed top-24 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold">
          <Icon name="CheckIcon" size={16} />
          {cartAdded} added to cart!
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <p className="section-label mb-3">Featured Products</p>
            <h2 className="text-display text-foreground">
              Our Best <span className="text-primary">Picks</span>
            </h2>
          </div>
          <Link href="/products" className="btn-ghost group self-start sm:self-auto">
            View All Products
            <Icon name="ArrowRightIcon" size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">No featured products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-reveal"
                style={{ opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.23,1,0.32,1)' }}
              >
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  isLoggedIn={!!user}
                  onLoginRequired={handleLoginRequired}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

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
  category_id?: string | null;
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
    if (!isLoggedIn) { onLoginRequired(); return; }
    setAdded(true);
    onAddToCart(product);
    setTimeout(() => setAdded(false), 1800);
  };

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const displayImg = (product.images && product.images.length > 0) ? product.images[0] : product.image_url;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="product-card group relative flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-warm hover:shadow-lg transition-shadow duration-300 flex-shrink-0 w-48 sm:w-56"
    >
      <div className="relative overflow-hidden aspect-[4/3] bg-secondary">
        <AppImage
          src={displayImg || '/assets/images/no_image.png'}
          alt={product.name}
          fill
          className="product-img object-cover"
          sizes="224px"
        />
        <div className="product-card-overlay absolute inset-0 bg-foreground/20 flex items-center justify-center">
          <button
            onClick={handleAdd}
            className={`px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-full transition-all duration-200 shadow-lg ${
              added ? 'bg-green-500 text-white scale-95' : 'bg-card text-foreground hover:bg-primary hover:text-primary-foreground scale-100'
            }`}
          >
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
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{product.categories?.name || ''}</p>
        <h3 className="text-xs font-bold text-foreground leading-tight line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Icon
                key={i}
                name="StarIcon"
                variant={i < Math.floor(product.rating) ? 'solid' : 'outline'}
                size={10}
                className={i < Math.floor(product.rating) ? 'text-primary' : 'text-border'}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">({product.review_count})</span>
        </div>
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          <span className="text-sm font-black text-foreground">{formatPrice(product.price)}</span>
          {product.original_price && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

interface CategoryRowProps {
  category: Category;
  products: Product[];
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  onAddToCart: (product: Product) => void;
}

function CategoryRow({ category, products, isLoggedIn, onLoginRequired, onAddToCart }: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <div className="mb-14">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-label mb-1">Collection</p>
          <h3 className="text-2xl font-black text-foreground">{category.name}</h3>
        </div>
        <Link
          href={`/collections?category=${category.slug}`}
          className="btn-ghost group flex items-center gap-1.5 text-sm font-black whitespace-nowrap"
        >
          View All {category.name}
          <Icon name="ArrowRightIcon" size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-card border border-border shadow-warm flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
          aria-label="Scroll left"
        >
          <Icon name="ChevronLeftIcon" size={16} />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.slice(0, 15).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              isLoggedIn={isLoggedIn}
              onLoginRequired={onLoginRequired}
            />
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-card border border-border shadow-warm flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
          aria-label="Scroll right"
        >
          <Icon name="ChevronRightIcon" size={16} />
        </button>
      </div>
    </div>
  );
}

export default function CategoryScrollRows() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  const [cartAdded, setCartAdded] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name, slug, is_active')
        .eq('is_active', true)
        .order('sort_order');

      if (cats && cats.length > 0) {
        setCategories(cats);
        const { data: products } = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (products) {
          const grouped: Record<string, Product[]> = {};
          for (const cat of cats) {
            grouped[cat.id] = products.filter((p) => p.category_id === cat.id);
          }
          setProductsByCategory(grouped);
        }
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = (product: Product) => {
    setCartAdded(product.name);
    setTimeout(() => setCartAdded(null), 2000);
  };

  const handleLoginRequired = () => {
    setShowLoginPrompt(true);
    setTimeout(() => setShowLoginPrompt(false), 3000);
  };

  const hasProducts = categories.some((cat) => (productsByCategory[cat.id] || []).length > 0);
  if (!hasProducts) return null;

  return (
    <section className="py-24 bg-background">
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

        {categories.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            products={productsByCategory[cat.id] || []}
            isLoggedIn={!!user}
            onLoginRequired={handleLoginRequired}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </section>
  );
}

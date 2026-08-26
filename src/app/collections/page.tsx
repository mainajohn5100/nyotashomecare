'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  categories?: { name: string; slug: string } | null;
}

function formatPrice(kes: number): string {
  return `KSh ${kes.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

interface ProductCardProps {
  product: Product;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, isLoggedIn, onLoginRequired, onAddToCart }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const displayImg = (product.images && product.images.length > 0) ? product.images[0] : product.image_url;
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { onLoginRequired(); return; }
    setAdded(true);
    onAddToCart(product);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-warm hover:shadow-lg transition-all flex-shrink-0 w-48 sm:w-56"
    >
      <div className="relative overflow-hidden aspect-[4/3] bg-secondary">
        <AppImage
          src={displayImg || '/assets/images/no_image.png'}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="224px"
        />
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
          <button
            onClick={handleAdd}
            className={`opacity-0 group-hover:opacity-100 px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-full transition-all duration-200 shadow-lg ${
              added ? 'bg-green-500 text-white' : 'bg-card text-foreground hover:bg-primary hover:text-primary-foreground'
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
        <h3 className="text-xs font-bold text-foreground leading-tight line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Icon key={i} name="StarIcon" variant={i < Math.floor(product.rating) ? 'solid' : 'outline'} size={10}
                className={i < Math.floor(product.rating) ? 'text-primary' : 'text-border'} />
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
  isHighlighted: boolean;
}

function CategoryRow({ category, products, isLoggedIn, onLoginRequired, onAddToCart, isHighlighted }: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isHighlighted]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' });
  };

  return (
    <div ref={rowRef} className={`mb-14 ${isHighlighted ? 'scroll-mt-24' : ''}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-label mb-1">Collection</p>
          <h3 className="text-2xl font-black text-foreground">{category.name}</h3>
          {category.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-md">{category.description}</p>
          )}
        </div>
        <Link
          href={`/collections?category=${category.slug}`}
          className="btn-ghost group flex items-center gap-1.5 text-sm font-black whitespace-nowrap"
        >
          View All {category.name}
          <Icon name="ArrowRightIcon" size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex items-center gap-3 py-8 text-muted-foreground">
          <Icon name="ArchiveBoxIcon" size={24} />
          <p className="text-sm">No products in this collection yet.</p>
        </div>
      ) : (
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
                isLoggedIn={isLoggedIn}
                onLoginRequired={onLoginRequired}
                onAddToCart={onAddToCart}
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
      )}
    </div>
  );
}

function CollectionsContent() {
  const searchParams = useSearchParams();
  const highlightSlug = searchParams.get('category');
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [cartAdded, setCartAdded] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
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
      setLoading(false);
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20">
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

        {/* Hero */}
        <div className="bg-secondary border-b border-border py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground transition-colors font-medium">Home</Link>
              <Icon name="ChevronRightIcon" size={12} />
              <span className="text-foreground font-bold">Collections</span>
            </nav>
            <h1 className="text-display text-foreground mb-3">
              Our <span className="text-primary">Collections</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Explore our curated collections of home goods, each thoughtfully designed to transform your living spaces.
            </p>
          </div>
        </div>

        {/* Category quick-nav */}
        {!loading && categories.length > 0 && (
          <div className="sticky top-16 z-20 bg-background/95 backdrop-blur border-b border-border">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
              <div className="flex gap-2 overflow-x-auto py-3" style={{ scrollbarWidth: 'none' }}>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/collections?category=${cat.slug}`}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      highlightSlug === cat.slug
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-6">
            <Icon name="ArchiveBoxIcon" size={48} className="text-muted-foreground mb-4" />
            <h2 className="text-xl font-black text-foreground mb-2">No Collections Yet</h2>
            <p className="text-muted-foreground mb-6">Collections will appear here once added from the admin panel.</p>
            <Link href="/products" className="btn-primary">Browse All Products</Link>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                products={productsByCategory[cat.id] || []}
                isLoggedIn={!!user}
                onLoginRequired={handleLoginRequired}
                onAddToCart={handleAddToCart}
                isHighlighted={highlightSlug === cat.slug}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
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
    </Suspense>
  );
}

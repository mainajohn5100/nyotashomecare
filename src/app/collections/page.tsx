'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  categories?: { name: string; slug: string } | null;
}

const KES_RATE = 130;
function formatPrice(usd: number): string {
  return `KSh ${(usd * KES_RATE).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

const categoryImages: Record<string, string> = {
  'living-room': 'https://images.unsplash.com/photo-1721902024689-c1d1bff5433d',
  'kitchen': 'https://images.unsplash.com/photo-1561554854-ae60cb36ebe9',
  'kitchenware': 'https://images.unsplash.com/photo-1561554854-ae60cb36ebe9',
  'bedroom': 'https://img.rocket.new/generatedImages/rocket_gen_img_1c5584ac7-1779535992329.png',
  'decor': 'https://images.unsplash.com/photo-1684129593661-a824cdd37f2e',
};

export default function CollectionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        setActiveCategory(cats[0].id);

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

  const activeCat = categories.find((c) => c.id === activeCategory);
  const activeProducts = activeCategory ? (productsByCategory[activeCategory] || []) : [];

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
              Our <span className="text-primary">Collections</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Explore our curated collections of home goods, each thoughtfully designed to transform your living spaces.
            </p>
          </div>
        </div>

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
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                    activeCategory === cat.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Active Category Hero */}
            {activeCat && (
              <div className="relative rounded-3xl overflow-hidden mb-10 h-56 sm:h-72">
                <AppImage
                  src={activeCat.image_url || categoryImages[activeCat.slug] || 'https://images.unsplash.com/photo-1721902024689-c1d1bff5433d'}
                  alt={activeCat.name}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12">
                  <h2 className="text-3xl sm:text-4xl font-black text-primary-foreground mb-2">{activeCat.name}</h2>
                  {activeCat.description && (
                    <p className="text-primary-foreground/80 text-sm max-w-md">{activeCat.description}</p>
                  )}
                  <p className="text-primary-foreground/60 text-xs font-bold mt-2 uppercase tracking-widest">
                    {activeProducts.length} {activeProducts.length === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </div>
            )}

            {/* Products Grid */}
            {activeProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Icon name="ArchiveBoxIcon" size={40} className="text-muted-foreground mb-3" />
                <p className="text-muted-foreground font-medium">No products in this collection yet.</p>
                <Link href="/products" className="mt-4 btn-secondary !text-xs !px-5 !py-2">Browse All Products</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {activeProducts.map((product) => {
                  const displayImg = (product.images && product.images.length > 0) ? product.images[0] : product.image_url;
                  const discount = product.original_price
                    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
                    : null;
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-warm hover:shadow-lg transition-all"
                    >
                      <div className="relative overflow-hidden aspect-[4/3] bg-secondary">
                        <AppImage
                          src={displayImg || '/assets/images/no_image.png'}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        />
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
                        <h3 className="text-xs sm:text-sm font-bold text-foreground leading-tight line-clamp-2">{product.name}</h3>
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
                          <span className="text-sm sm:text-base font-black text-foreground">{formatPrice(product.price)}</span>
                          {product.original_price && (
                            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

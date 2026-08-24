'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  price: number;
  original_price?: number | null;
  rating: number;
  review_count: number;
  image_url: string;
  images?: string[];
  badge?: string;
  is_featured?: boolean;
  is_active?: boolean;
  categories?: { name: string; slug: string } | null;
}

const categories = ['All', 'Living Room', 'Bedroom', 'Kitchenware', 'Décor'];
const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Best Rated', 'Newest'];
const priceRanges = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under KSh 5,000', min: 0, max: 5000 },
  { label: 'KSh 5,000 – 15,000', min: 5000, max: 15000 },
  { label: 'KSh 15,000 – 50,000', min: 15000, max: 50000 },
  { label: 'KSh 50,000+', min: 50000, max: Infinity },
];

const KES_RATE = 130;

function formatPrice(usd: number): string {
  return `KSh ${(usd * KES_RATE).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export default function ProductsClient() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePriceRange, setActivePriceRange] = useState(0);
  const [activeSort, setActiveSort] = useState('Featured');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setProducts(data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filtered = products
    .filter((p) => {
      if (activeCategory === 'All') return true;
      return p.categories?.name === activeCategory;
    })
    .filter((p) => {
      const range = priceRanges[activePriceRange];
      const kes = p.price * KES_RATE;
      return kes >= range.min && kes <= range.max;
    })
    .sort((a, b) => {
      switch (activeSort) {
        case 'Price: Low to High': return a.price - b.price;
        case 'Price: High to Low': return b.price - a.price;
        case 'Best Rated': return b.rating - a.rating;
        case 'Newest': return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
        default: return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      }
    });

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('.pgrid-card');
    cards.forEach((card, i) => {
      (card as HTMLElement).style.opacity = '0';
      (card as HTMLElement).style.transform = 'translateY(20px)';
      setTimeout(() => {
        (card as HTMLElement).style.opacity = '1';
        (card as HTMLElement).style.transform = 'translateY(0)';
      }, i * 60);
    });
  }, [filtered.length, activeCategory, activePriceRange, activeSort]);

  const handleAdd = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }
    setAddedId(id);
    setTimeout(() => setAddedId(null), 1800);
  };

  return (
    <div className="min-h-screen bg-background">
      {showLoginPrompt && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-5 py-3 rounded-full shadow-lg flex items-center gap-3 text-sm font-bold animate-fade-in">
          <Icon name="LockClosedIcon" size={16} />
          Please <Link href="/login?next=/products" className="underline text-primary-foreground">sign in</Link> to add items to cart
        </div>
      )}
      <div className="bg-secondary border-b border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-3" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-foreground transition-colors font-medium">Home</Link>
                <Icon name="ChevronRightIcon" size={12} />
                <span className="text-foreground font-bold">Products</span>
              </nav>
              <h1 className="text-display text-foreground">
                Shop <span className="text-primary">All</span>
              </h1>
              <p className="text-muted-foreground mt-2">{filtered.length} products found</p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden btn-secondary !px-5 !py-2.5 self-start sm:self-auto">
              <Icon name="AdjustmentsHorizontalIcon" size={18} />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex gap-10">
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-60 flex-shrink-0`}>
            <div className="sticky top-28 bg-card border border-border rounded-2xl p-6 shadow-warm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-black text-foreground text-sm uppercase tracking-widest">Filters</h2>
                <button
                  onClick={() => { setActiveCategory('All'); setActivePriceRange(0); setActiveSort('Featured'); }}
                  className="text-xs text-primary hover:text-accent font-bold transition-colors">
                  Reset
                </button>
              </div>
              <div className="mb-7">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Category</p>
                <div className="flex flex-col gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`text-left text-sm font-semibold px-3 py-2.5 rounded-xl transition-all ${activeCategory === cat ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-7">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Price Range</p>
                <div className="flex flex-col gap-2">
                  {priceRanges.map((range, i) => (
                    <button
                      key={range.label}
                      onClick={() => setActivePriceRange(i)}
                      className={`text-left text-sm font-semibold px-3 py-2.5 rounded-xl transition-all ${activePriceRange === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Sort By</p>
                <div className="flex flex-col gap-2">
                  {sortOptions.map((sort) => (
                    <button
                      key={sort}
                      onClick={() => setActiveSort(sort)}
                      className={`text-left text-sm font-semibold px-3 py-2.5 rounded-xl transition-all ${activeSort === sort ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                      {sort}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {(activeCategory !== 'All' || activePriceRange !== 0) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {activeCategory !== 'All' && (
                  <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                    {activeCategory}
                    <button onClick={() => setActiveCategory('All')} className="hover:text-accent">
                      <Icon name="XMarkIcon" size={12} />
                    </button>
                  </span>
                )}
                {activePriceRange !== 0 && (
                  <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                    {priceRanges[activePriceRange].label}
                    <button onClick={() => setActivePriceRange(0)} className="hover:text-accent">
                      <Icon name="XMarkIcon" size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-32">
                <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <Icon name="MagnifyingGlassIcon" size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-xl font-black text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your filters.</p>
                <button onClick={() => { setActiveCategory('All'); setActivePriceRange(0); }} className="btn-primary">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {filtered.map((product) => {
                  const discount = product.original_price
                    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
                    : null;
                  const displayImg = (product.images && product.images.length > 0) ? product.images[0] : product.image_url;

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="pgrid-card product-card group relative flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-warm hover:shadow-lg"
                      style={{ transition: 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s ease' }}>
                      <div className="relative overflow-hidden aspect-[4/3] bg-secondary">
                        <AppImage
                          src={displayImg || '/assets/images/no_image.png'}
                          alt={product.name}
                          fill
                          className="product-img object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw" />
                        <div className="product-card-overlay absolute inset-0 bg-foreground/20 flex items-end justify-center pb-3">
                          <button
                            onClick={(e) => handleAdd(product.id, e)}
                            className={`px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-full transition-all duration-200 shadow-lg ${addedId === product.id ? 'bg-green-500 text-white' : 'bg-card text-foreground hover:bg-primary hover:text-primary-foreground'}`}>
                            {addedId === product.id ? '✓ Added!' : 'Add to Cart'}
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
        </div>
      </div>
    </div>
  );
}
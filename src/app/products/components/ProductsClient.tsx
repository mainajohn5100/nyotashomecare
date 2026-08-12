'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  img: string;
  alt: string;
  badge?: string;
  isNew?: boolean;
  isSale?: boolean;
}

const allProducts: Product[] = [
{ id: 1, name: 'Linen Cloud Sofa', category: 'Living Room', price: 899, originalPrice: 1199, rating: 4.9, reviews: 312, img: "https://img.rocket.new/generatedImages/rocket_gen_img_14cd98208-1772851737802.png", alt: 'Plush linen sofa in warm sand color with rounded arms and deep cushions on a light hardwood floor', badge: 'Best Seller', isSale: true },
{ id: 2, name: 'Terracotta Mug Set', category: 'Kitchenware', price: 54, rating: 4.8, reviews: 189, img: "https://images.unsplash.com/photo-1688938675788-657ea207453a", alt: 'Set of four handcrafted terracotta mugs with matte glaze arranged on a rustic wooden surface in warm morning light' },
{ id: 3, name: 'Rattan Accent Chair', category: 'Living Room', price: 349, rating: 4.7, reviews: 98, img: "https://images.unsplash.com/photo-1684424567465-8332058b1e6a", alt: 'Handwoven rattan accent chair with natural finish and cream cushion beside a sunlit window with plants', badge: 'New', isNew: true },
{ id: 4, name: 'Linen Duvet Cover', category: 'Bedroom', price: 129, originalPrice: 159, rating: 4.9, reviews: 445, img: "https://images.unsplash.com/photo-1721902020524-f0c0edd25f3f", alt: 'Neatly made bed with soft washed linen duvet in warm stone color, layered pillows, bright airy bedroom', isSale: true },
{ id: 5, name: 'Ceramic Vase Trio', category: 'Décor', price: 89, rating: 4.8, reviews: 221, img: "https://images.unsplash.com/photo-1590860778262-2d8ddead7c1a", alt: 'Three ceramic vases in graduated sizes with matte white and cream glazes on a light wooden shelf', badge: 'Popular' },
{ id: 6, name: 'Cast Iron Skillet', category: 'Kitchenware', price: 79, rating: 4.9, reviews: 567, img: "https://images.unsplash.com/photo-1722795713888-60a6526b5979", alt: 'Pre-seasoned cast iron skillet on a gas stove with vegetables sizzling, rustic kitchen background' },
{ id: 7, name: 'Walnut Side Table', category: 'Living Room', price: 229, rating: 4.7, reviews: 134, img: "https://images.unsplash.com/photo-1613685302957-5f3e5dbc70c5", alt: 'Solid walnut round side table with hairpin legs beside a cozy armchair in a warm living room', badge: 'New', isNew: true },
{ id: 8, name: 'Woven Storage Basket', category: 'Décor', price: 45, rating: 4.6, reviews: 88, img: "https://img.rocket.new/generatedImages/rocket_gen_img_1aa9f1e87-1769498614530.png", alt: 'Handwoven seagrass storage basket with leather handles on a light wood floor next to a couch' },
{ id: 9, name: 'Velvet Throw Pillow', category: 'Bedroom', price: 39, rating: 4.7, reviews: 203, img: "https://images.unsplash.com/photo-1585652992436-52df88edd88a", alt: 'Plush velvet throw pillow in deep terracotta color on a cream linen couch in a warm interior', isNew: true },
{ id: 10, name: 'Copper Pour-Over Set', category: 'Kitchenware', price: 95, rating: 4.8, reviews: 156, img: "https://images.unsplash.com/photo-1594409060726-0dc09d48f3dd", alt: 'Brushed copper pour-over coffee set on a white marble countertop in a bright minimal kitchen' },
{ id: 11, name: 'Sheepskin Area Rug', category: 'Living Room', price: 189, originalPrice: 249, rating: 4.8, reviews: 177, img: "https://img.rocket.new/generatedImages/rocket_gen_img_1fba0851b-1772131307913.png", alt: 'Soft ivory sheepskin area rug layered over light wood floor in a bright contemporary living room', isSale: true },
{ id: 12, name: 'Linen Table Runner', category: 'Kitchenware', price: 28, rating: 4.5, reviews: 64, img: "https://images.unsplash.com/photo-1585822027083-535befd83345", alt: 'Natural linen table runner on a wooden dining table with simple ceramic tableware and fresh flowers' }];


const categories = ['All', 'Living Room', 'Bedroom', 'Kitchenware', 'Décor'];
const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Best Rated', 'Newest'];
const priceRanges = [
{ label: 'All Prices', min: 0, max: Infinity },
{ label: 'Under $50', min: 0, max: 50 },
{ label: '$50 – $100', min: 50, max: 100 },
{ label: '$100 – $300', min: 100, max: 300 },
{ label: '$300+', min: 300, max: Infinity }];


export default function ProductsClient() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePriceRange, setActivePriceRange] = useState(0);
  const [activeSort, setActiveSort] = useState('Featured');
  const [addedId, setAddedId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();

  const filtered = allProducts.
  filter((p) => activeCategory === 'All' || p.category === activeCategory).
  filter((p) => {
    const range = priceRanges[activePriceRange];
    return p.price >= range.min && p.price <= range.max;
  }).
  sort((a, b) => {
    switch (activeSort) {
      case 'Price: Low to High':return a.price - b.price;
      case 'Price: High to Low':return b.price - a.price;
      case 'Best Rated':return b.rating - a.rating;
      case 'Newest':return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      default:return 0;
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

  const handleAdd = (id: number, e: React.MouseEvent) => {
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
      {/* Login prompt toast */}
      {showLoginPrompt && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-5 py-3 rounded-full shadow-lg flex items-center gap-3 text-sm font-bold animate-fade-in">
          <Icon name="LockClosedIcon" size={16} />
          Please <Link href="/login?next=/products" className="underline text-primary-foreground">sign in</Link> to add items to cart
        </div>
      )}
      {/* Page Header */}
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
            {/* Mobile filter toggle */}
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
          {/* Sidebar Filters */}
          <aside
            className={`${
            sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-60 flex-shrink-0`
            }>
            
            <div className="sticky top-28 bg-card border border-border rounded-2xl p-6 shadow-warm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-black text-foreground text-sm uppercase tracking-widest">Filters</h2>
                <button
                  onClick={() => {setActiveCategory('All');setActivePriceRange(0);setActiveSort('Featured');}}
                  className="text-xs text-primary hover:text-accent font-bold transition-colors">
                  
                  Reset
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-7">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Category</p>
                <div className="flex flex-col gap-2">
                  {categories.map((cat) =>
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-left text-sm font-semibold px-3 py-2.5 rounded-xl transition-all ${
                    activeCategory === cat ?
                    'bg-primary text-primary-foreground' :
                    'text-muted-foreground hover:text-foreground hover:bg-secondary'}`
                    }>
                    
                      {cat}
                    </button>
                  )}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-7">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Price Range</p>
                <div className="flex flex-col gap-2">
                  {priceRanges.map((range, i) =>
                  <button
                    key={range.label}
                    onClick={() => setActivePriceRange(i)}
                    className={`text-left text-sm font-semibold px-3 py-2.5 rounded-xl transition-all ${
                    activePriceRange === i ?
                    'bg-primary text-primary-foreground' :
                    'text-muted-foreground hover:text-foreground hover:bg-secondary'}`
                    }>
                    
                      {range.label}
                    </button>
                  )}
                </div>
              </div>

              {/* Sort */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Sort By</p>
                <div className="flex flex-col gap-2">
                  {sortOptions.map((sort) =>
                  <button
                    key={sort}
                    onClick={() => setActiveSort(sort)}
                    className={`text-left text-sm font-semibold px-3 py-2.5 rounded-xl transition-all ${
                    activeSort === sort ?
                    'bg-primary text-primary-foreground' :
                    'text-muted-foreground hover:text-foreground hover:bg-secondary'}`
                    }>
                    
                      {sort}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {/* Active filters row */}
            {(activeCategory !== 'All' || activePriceRange !== 0) &&
            <div className="flex flex-wrap gap-2 mb-6">
                {activeCategory !== 'All' &&
              <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                    {activeCategory}
                    <button onClick={() => setActiveCategory('All')} className="hover:text-accent">
                      <Icon name="XMarkIcon" size={12} />
                    </button>
                  </span>
              }
                {activePriceRange !== 0 &&
              <span className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                    {priceRanges[activePriceRange].label}
                    <button onClick={() => setActivePriceRange(0)} className="hover:text-accent">
                      <Icon name="XMarkIcon" size={12} />
                    </button>
                  </span>
              }
              </div>
            }

            {filtered.length === 0 ?
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <Icon name="MagnifyingGlassIcon" size={48} className="text-muted-foreground mb-4" />
                <h3 className="text-xl font-black text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your filters.</p>
                <button onClick={() => {setActiveCategory('All');setActivePriceRange(0);}} className="btn-primary">
                  Clear Filters
                </button>
              </div> :

            <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                {filtered.map((product) => {
                const discount = product.originalPrice ?
                Math.round((product.originalPrice - product.price) / product.originalPrice * 100) :
                null;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                    className="pgrid-card product-card group relative flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-warm hover:shadow-lg"
                    style={{ transition: 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s ease' }}>
                    
                      {/* Image */}
                      <div className="relative overflow-hidden aspect-[4/3] bg-secondary">
                        <AppImage
                        src={product.img}
                        alt={product.alt}
                        fill
                        className="product-img object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw" />
                      
                        <div className="product-card-overlay absolute inset-0 bg-foreground/20 flex items-end justify-center pb-3">
                          <button
                          onClick={(e) => handleAdd(product.id, e)}
                          className={`px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-full transition-all duration-200 shadow-lg ${
                          addedId === product.id ?
                          'bg-green-500 text-white' : 'bg-card text-foreground hover:bg-primary hover:text-primary-foreground'}`
                          }>
                          
                            {addedId === product.id ? '✓ Added!' : 'Add to Cart'}
                          </button>
                        </div>
                        {product.badge &&
                      <div className={`absolute top-2 left-2 ${product.isNew ? 'bg-foreground' : 'bg-primary'} text-primary-foreground text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full`}>
                            {product.badge}
                          </div>
                      }
                        {discount &&
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full">
                            -{discount}%
                          </div>
                      }
                      </div>

                      {/* Info */}
                      <div className="p-2.5 sm:p-3 flex flex-col gap-1 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{product.category}</p>
                        <h3 className="text-xs sm:text-sm font-bold text-foreground leading-tight line-clamp-2">{product.name}</h3>
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) =>
                          <Icon key={i} name="StarIcon" variant={i < Math.floor(product.rating) ? 'solid' : 'outline'} size={10}
                          className={i < Math.floor(product.rating) ? 'text-primary' : 'text-border'} />
                          )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">({product.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-auto pt-1">
                          <span className="text-sm sm:text-base font-black text-foreground">${product.price}</span>
                          {product.originalPrice &&
                        <span className="text-xs text-muted-foreground line-through">${product.originalPrice}</span>
                        }
                        </div>
                      </div>
                    </Link>);

              })}
              </div>
            }
          </div>
        </div>
      </div>
    </div>);

}
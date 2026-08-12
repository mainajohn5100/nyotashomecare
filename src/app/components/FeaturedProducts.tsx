'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  badgeColor?: string;
}

const products: Product[] = [
{
  id: 1,
  name: 'Linen Cloud Sofa',
  category: 'Living Room',
  price: 899,
  originalPrice: 1199,
  rating: 4.9,
  reviews: 312,
  img: "https://img.rocket.new/generatedImages/rocket_gen_img_14cd98208-1772851737802.png",
  alt: 'Plush linen sofa in warm sand color with rounded arms and deep cushions on a light hardwood floor',
  badge: 'Best Seller',
  badgeColor: 'bg-primary'
},
{
  id: 2,
  name: 'Terracotta Mug Set',
  category: 'Kitchenware',
  price: 54,
  rating: 4.8,
  reviews: 189,
  img: "https://images.unsplash.com/photo-1688938675788-657ea207453a",
  alt: 'Set of four handcrafted terracotta mugs with matte glaze arranged on a rustic wooden surface in warm morning light'
},
{
  id: 3,
  name: 'Rattan Accent Chair',
  category: 'Living Room',
  price: 349,
  rating: 4.7,
  reviews: 98,
  img: "https://images.unsplash.com/photo-1684424567465-8332058b1e6a",
  alt: 'Handwoven rattan accent chair with natural finish and cream cushion beside a sunlit window with plants',
  badge: 'New',
  badgeColor: 'bg-secondary-foreground'
},
{
  id: 4,
  name: 'Linen Duvet Cover',
  category: 'Bedroom',
  price: 129,
  originalPrice: 159,
  rating: 4.9,
  reviews: 445,
  img: "https://images.unsplash.com/photo-1721902020524-f0c0edd25f3f",
  alt: 'Neatly made bed with soft washed linen duvet in warm stone color, layered pillows, bright airy bedroom'
},
{
  id: 5,
  name: 'Ceramic Vase Trio',
  category: 'Décor',
  price: 89,
  rating: 4.8,
  reviews: 221,
  img: "https://images.unsplash.com/photo-1590860778262-2d8ddead7c1a",
  alt: 'Three ceramic vases in graduated sizes with matte white and cream glazes on a light wooden shelf',
  badge: 'Popular',
  badgeColor: 'bg-primary'
},
{
  id: 6,
  name: 'Cast Iron Skillet',
  category: 'Kitchenware',
  price: 79,
  rating: 4.9,
  reviews: 567,
  img: "https://images.unsplash.com/photo-1722795713888-60a6526b5979",
  alt: 'Pre-seasoned cast iron skillet on a gas stove with vegetables sizzling, rustic kitchen background'
},
{
  id: 7,
  name: 'Walnut Side Table',
  category: 'Living Room',
  price: 229,
  rating: 4.7,
  reviews: 134,
  img: "https://images.unsplash.com/photo-1613685302957-5f3e5dbc70c5",
  alt: 'Solid walnut round side table with hairpin legs beside a cozy armchair in a warm living room',
  badge: 'New',
  badgeColor: 'bg-secondary-foreground'
},
{
  id: 8,
  name: 'Woven Storage Basket',
  category: 'Décor',
  price: 45,
  rating: 4.6,
  reviews: 88,
  img: "https://img.rocket.new/generatedImages/rocket_gen_img_1aa9f1e87-1769498614530.png",
  alt: 'Handwoven seagrass storage basket with leather handles on a light wood floor next to a couch'
}];


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

  const discount = product.originalPrice ?
  Math.round((product.originalPrice - product.price) / product.originalPrice * 100) :
  null;

  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <Link href={`/products/${slug}`} className="product-card group relative flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-warm hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3] bg-secondary">
        <AppImage
          src={product.img}
          alt={product.alt}
          fill
          className="product-img object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
        
        {/* Hover overlay */}
        <div className="product-card-overlay absolute inset-0 bg-foreground/20 flex items-center justify-center">
          <button
            onClick={handleAdd}
            className={`px-4 py-2 font-black text-[10px] uppercase tracking-widest rounded-full transition-all duration-200 shadow-lg ${
            added ?
            'bg-green-500 text-white scale-95' : 'bg-card text-foreground hover:bg-primary hover:text-primary-foreground scale-100'}`
            }>
            
            {added ? '✓ Added!' : 'Add to Cart'}
          </button>
        </div>

        {/* Badge */}
        {product.badge &&
        <div className={`absolute top-2 left-2 ${product.badgeColor} text-primary-foreground text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full`}>
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
            <Icon
              key={i}
              name="StarIcon"
              variant={i < Math.floor(product.rating) ? 'solid' : 'outline'}
              size={10}
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

}

export default function FeaturedProducts() {
  const [cartAdded, setCartAdded] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { user } = useAuth();

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
      {/* Login prompt toast */}
      {showLoginPrompt && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-5 py-3 rounded-full shadow-lg flex items-center gap-3 text-sm font-bold">
          <Icon name="LockClosedIcon" size={16} />
          Please <Link href="/login?next=/" className="underline text-primary-foreground">sign in</Link> to add items to cart
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <p className="section-label mb-3">Handpicked For You</p>
            <h2 className="text-display text-foreground">
              Featured<br />
              <span className="text-primary">Products</span>
            </h2>
          </div>
          <Link href="/products" className="btn-ghost group self-start sm:self-auto">
            View All Products
            <Icon name="ArrowRightIcon" size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-5">
          {products.map((product, i) =>
          <div
            key={product.id}
            className="product-reveal"
            style={{ opacity: 0, transform: 'translateY(30px)', transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.23,1,0.32,1)' }}>
            
            <ProductCard
              product={product}
              onAddToCart={handleAddToCart}
              isLoggedIn={!!user}
              onLoginRequired={handleLoginRequired} />
          </div>
          )}
        </div>

        {/* Toast notification */}
        {cartAdded &&
        <div className="fixed bottom-8 right-8 z-50 bg-foreground text-background px-6 py-4 rounded-2xl shadow-warm flex items-center gap-3 animate-float-slow">
            <Icon name="CheckCircleIcon" size={20} className="text-primary" variant="solid" />
            <span className="font-bold text-sm">{cartAdded} added to cart!</span>
          </div>
        }
      </div>
    </section>);

}
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { addToCart } from '@/lib/cart';

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    original_price: number | null;
    image_url: string;
    images: string[] | null;
    badge: string;
    stock_quantity: number;
    categories?: { name: string } | null;
  };
}

function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/wishlist');
    }
  }, [user, authLoading, router]);

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('wishlists')
      .select('id, product_id, created_at, products(id, name, slug, price, original_price, image_url, images, badge, stock_quantity, categories(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setItems(data as WishlistItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user, fetchWishlist]);

  const removeFromWishlist = async (wishlistId: string) => {
    setRemovingId(wishlistId);
    const supabase = createClient();
    await supabase.from('wishlists').delete().eq('id', wishlistId);
    setItems((prev) => prev.filter((i) => i.id !== wishlistId));
    setRemovingId(null);
  };

  const handleAddToCart = (item: WishlistItem) => {
    const p = item.products;
    const img = (p.images && p.images.length > 0) ? p.images[0] : p.image_url;
    addToCart({
      id: p.id,
      name: p.name,
      category: p.categories?.name || '',
      price: p.price,
      quantity: 1,
      img: img || '/assets/images/no_image.png',
      alt: p.name,
      slug: p.slug,
    });
    window.dispatchEvent(new Event('cart-updated'));
    setAddedToCart(item.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  if (authLoading || loading) {
    return (
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
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors font-medium">Home</Link>
            <Icon name="ChevronRightIcon" size={12} />
            <span className="text-foreground font-bold">Wishlist</span>
          </nav>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">
                My <span className="text-primary">Wishlist</span>
              </h1>
              <p className="text-muted-foreground mt-1">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
            </div>
            <Link href="/products" className="btn-secondary !px-5 !py-2.5 !text-xs">
              <Icon name="ShoppingBagIcon" size={16} />
              Browse Products
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <Icon name="HeartIcon" size={36} className="text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-3">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-8">Save items you love and come back to them anytime.</p>
              <Link href="/products" className="btn-primary">
                Explore Products
                <Icon name="ArrowRightIcon" size={18} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => {
                const p = item.products;
                const img = (p.images && p.images.length > 0) ? p.images[0] : p.image_url;
                const discount = p.original_price
                  ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
                  : null;
                const isRemoving = removingId === item.id;
                const isAdded = addedToCart === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-card border border-border rounded-2xl overflow-hidden shadow-warm group transition-all"
                    style={{
                      opacity: isRemoving ? 0 : 1,
                      transform: isRemoving ? 'scale(0.95)' : 'scale(1)',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                    }}
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-secondary overflow-hidden">
                      <Link href={`/products/${p.slug}`}>
                        <AppImage
                          src={img || '/assets/images/no_image.png'}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      </Link>
                      {p.badge && (
                        <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                          {p.badge}
                        </div>
                      )}
                      {discount && (
                        <div className="absolute top-3 right-10 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                          -{discount}%
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        disabled={isRemoving}
                        aria-label="Remove from wishlist"
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Icon name="HeartIcon" size={16} className="text-red-500" variant="solid" />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      {p.categories?.name && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{p.categories.name}</p>
                      )}
                      <Link href={`/products/${p.slug}`}>
                        <h3 className="font-black text-foreground text-sm leading-tight mb-2 hover:text-primary transition-colors line-clamp-2">{p.name}</h3>
                      </Link>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-lg font-black text-foreground">{formatKES(p.price)}</span>
                        {p.original_price && (
                          <span className="text-sm text-muted-foreground line-through">{formatKES(p.original_price)}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-muted-foreground font-medium">
                          {p.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(item)}
                        disabled={p.stock_quantity === 0}
                        className={`w-full py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                          isAdded
                            ? 'bg-green-500 text-white' :'bg-primary text-primary-foreground hover:bg-accent'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isAdded ? '✓ Added to Cart!' : p.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

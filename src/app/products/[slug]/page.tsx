'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  images: string[] | null;
  badge: string;
  rating: number;
  review_count: number;
  stock_quantity: number;
  is_featured: boolean;
  categories?: { name: string; slug: string } | null;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
}

const KES_RATE = 130;
function formatPrice(usd: number): string {
  return `KSh ${(usd * KES_RATE).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { user } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .single();

      if (data) {
        setProduct(data);
        setActiveImg(0);
        if (data.category_id) {
          const { data: related } = await supabase
            .from('products')
            .select('*, categories(name, slug)')
            .eq('category_id', data.category_id)
            .neq('id', data.id)
            .eq('is_active', true)
            .limit(4);
          if (related) setRelatedProducts(related);
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  const allImages = product
    ? [
        ...(product.images && product.images.length > 0 ? product.images : []),
        ...(product.image_url && !(product.images && product.images.includes(product.image_url)) ? [product.image_url] : []),
      ].filter(Boolean)
    : [];

  const handleAddToCart = useCallback(() => {
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }
    if (!product) return;
    try {
      const stored = localStorage.getItem('cart');
      const cart: CartItem[] = stored ? JSON.parse(stored) : [];
      const existing = cart.find(item => item.id === product.id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, product.stock_quantity);
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price * KES_RATE,
          quantity,
          image: allImages[0] || '/assets/images/no_image.png',
          slug: product.slug,
        });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));
    } catch {}
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [user, product, quantity, allImages]);

  const discount = product?.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  if (loading) {
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

  if (!product) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-background pt-20 text-center px-6">
          <Icon name="ArchiveBoxXMarkIcon" size={64} className="text-muted-foreground mb-4" />
          <h1 className="text-2xl font-black text-foreground mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">This product may have been removed or the link is incorrect.</p>
          <Link href="/products" className="btn-primary">Browse All Products</Link>
        </div>
        <Footer />
      </>
    );
  }

  const currentImage = allImages[activeImg] || '/assets/images/no_image.png';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors font-medium">Home</Link>
            <Icon name="ChevronRightIcon" size={12} />
            <Link href="/products" className="hover:text-foreground transition-colors font-medium">Products</Link>
            {product.categories && (
              <>
                <Icon name="ChevronRightIcon" size={12} />
                <Link href={`/products?category=${product.categories.slug}`} className="hover:text-foreground transition-colors font-medium">
                  {product.categories.name}
                </Link>
              </>
            )}
            <Icon name="ChevronRightIcon" size={12} />
            <span className="text-foreground font-bold truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* Product Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Images */}
            <div>
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-secondary border border-border mb-3">
                <AppImage
                  key={currentImage}
                  src={currentImage}
                  alt={`${product.name} - image ${activeImg + 1}`}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {product.badge && (
                  <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {product.badge}
                  </div>
                )}
                {discount && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    -{discount}%
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={`thumb-${i}-${img}`}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'}`}
                    >
                      <AppImage src={img} alt={`${product.name} thumbnail ${i + 1}`} width={64} height={64} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              {product.categories && (
                <Link
                  href={`/products?category=${product.categories.slug}`}
                  className="text-xs font-bold uppercase tracking-widest text-primary hover:text-accent transition-colors mb-3"
                >
                  {product.categories.name}
                </Link>
              )}
              <h1 className="text-4xl font-black text-foreground leading-tight mb-4">{product.name}</h1>

              <div className="flex items-center gap-2 mb-5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      name="StarIcon"
                      variant={i < Math.floor(product.rating) ? 'solid' : 'outline'}
                      size={16}
                      className={i < Math.floor(product.rating) ? 'text-primary' : 'text-border'}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.review_count} reviews)</span>
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-black text-foreground">{formatPrice(product.price)}</span>
                {product.original_price && (
                  <span className="text-xl text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                )}
                {discount && (
                  <span className="text-sm font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                    Save {discount}%
                  </span>
                )}
              </div>

              {product.description ? (
                <div className="mb-8">
                  <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-2">About this product</h2>
                  <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              ) : (
                <div className="mb-8 p-4 bg-secondary rounded-2xl border border-border">
                  <p className="text-sm text-muted-foreground italic">No description available for this product yet.</p>
                </div>
              )}

              <div className="flex items-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-bold text-foreground">
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                </span>
              </div>

              {/* Login prompt */}
              {showLoginPrompt && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                  <Icon name="ExclamationTriangleIcon" size={16} className="text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800 font-medium">
                    Please{' '}
                    <Link href="/login" className="font-black underline">sign in</Link>
                    {' '}to add items to your cart.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 bg-secondary rounded-full border border-border p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-background transition-colors text-foreground font-black"
                  >
                    <Icon name="MinusIcon" size={16} />
                  </button>
                  <span className="w-10 text-center font-black text-foreground">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                    disabled={quantity >= product.stock_quantity}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-background transition-colors text-foreground font-black disabled:opacity-40"
                  >
                    <Icon name="PlusIcon" size={16} />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                  className={`flex-1 py-3.5 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-200 ${
                    added ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-accent'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {added ? '✓ Added to Cart!' : product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border">
                {[
                  { icon: 'TruckIcon', label: 'Free Delivery', sub: 'Orders over KSh 5,000' },
                  { icon: 'ArrowPathIcon', label: '30-Day Returns', sub: 'Easy returns' },
                  { icon: 'ShieldCheckIcon', label: 'Quality Guarantee', sub: 'Handpicked items' },
                ].map((feat) => (
                  <div key={feat.label} className="text-center">
                    <Icon name={feat.icon as any} size={20} className="text-primary mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-foreground">{feat.label}</p>
                    <p className="text-[10px] text-muted-foreground">{feat.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-card border border-border rounded-3xl p-8 mb-16">
            <h2 className="text-xl font-black text-foreground mb-6">Product Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Category', value: product.categories?.name || 'Uncategorized' },
                { label: 'Rating', value: `${product.rating} / 5.0 (${product.review_count} reviews)` },
                { label: 'Availability', value: product.stock_quantity > 0 ? `In Stock (${product.stock_quantity} units)` : 'Out of Stock' },
                { label: 'Price', value: `${formatPrice(product.price)}${product.original_price ? ` (was ${formatPrice(product.original_price)})` : ''}` },
                ...(product.badge ? [{ label: 'Tag', value: product.badge }] : []),
              ].map((detail) => (
                <div key={detail.label} className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{detail.label}</span>
                  <span className="text-sm font-bold text-foreground">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-foreground mb-6">
                More from <span className="text-primary">{product.categories?.name}</span>
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {relatedProducts.map((related) => {
                  const relatedImg = (related.images && related.images.length > 0) ? related.images[0] : related.image_url;
                  return (
                    <Link
                      key={related.id}
                      href={`/products/${related.slug}`}
                      className="group bg-card border border-border rounded-2xl overflow-hidden shadow-warm hover:shadow-lg transition-all"
                    >
                      <div className="relative aspect-square bg-secondary overflow-hidden">
                        <AppImage
                          src={relatedImg || '/assets/images/no_image.png'}
                          alt={related.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      </div>
                      <div className="p-4">
                        <p className="font-bold text-foreground text-sm leading-tight mb-1">{related.name}</p>
                        <p className="text-lg font-black text-foreground">{formatPrice(related.price)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

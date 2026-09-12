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

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  user_profiles?: { full_name: string } | null;
}

function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
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
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const fetchReviews = useCallback(async (productId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, title, body, created_at, user_profiles(full_name)')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    if (data) setReviews(data);

    if (user) {
      // Check if user already reviewed
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single();
      setUserHasReviewed(!!existing);

      // Check if user has a delivered order containing this product
      const { data: deliveredItems } = await supabase
        .from('order_items')
        .select('id, orders!inner(user_id, status)')
        .eq('product_id', productId)
        .eq('orders.user_id', user.id)
        .eq('orders.status', 'delivered');
      setCanReview(!!(deliveredItems && deliveredItems.length > 0));
    }
  }, [user]);

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
        fetchReviews(data.id);
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
        // Check wishlist
        if (user) {
          const { data: wl } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', data.id)
            .single();
          setInWishlist(!!wl);
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [slug, fetchReviews, user]);

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
      const stored = localStorage.getItem('nyotas_cart');
      const cart = stored ? JSON.parse(stored) : [];
      const existing = cart.find((item: any) => item.id === product.id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, product.stock_quantity);
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          category: product.categories?.name || '',
          price: product.price,
          quantity,
          img: allImages[0] || '/assets/images/no_image.png',
          alt: product.name,
          slug: product.slug,
        });
      }
      localStorage.setItem('nyotas_cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('cart-updated'));
    } catch { }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [user, product, quantity, allImages]);

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!product) return;
    setWishlistLoading(true);
    const supabase = createClient();
    if (inWishlist) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', product.id);
      setInWishlist(false);
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: product.id });
      setInWishlist(true);
    }
    setWishlistLoading(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    if (!product) return;
    setSubmittingReview(true);
    setReviewError('');
    try {
      const supabase = createClient();
      const { error } = await supabase.from('reviews').insert({
        product_id: product.id,
        user_id: user.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        body: reviewForm.body,
      });
      if (error) throw error;
      setReviewSuccess(true);
      setUserHasReviewed(true);
      setReviewForm({ rating: 5, title: '', body: '' });
      fetchReviews(product.id);
    } catch (err: any) {
      if (err?.code === '23505') {
        setReviewError('You have already reviewed this product.');
      } else {
        setReviewError(err?.message || 'Failed to submit review. Please try again.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const discount = product?.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  // JSON-LD structured data
  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - available at Nyotas Homecare`,
    image: allImages.length > 0 ? allImages : [product.image_url],
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Nyotas Homecare',
    },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://homevibe5370.builtwithrocket.new'}/products/${product.slug}`,
      priceCurrency: 'KES',
      price: product.price.toFixed(0),
      availability: product.stock_quantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Nyotas Homecare',
      },
    },
    ...(product.review_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.review_count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  } : null;

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
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
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
                <span className="text-4xl font-black text-foreground">{formatKES(product.price)}</span>
                {product.original_price && (
                  <span className="text-xl text-muted-foreground line-through">{formatKES(product.original_price)}</span>
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

              <div className="flex items-center gap-4 mb-4">
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
                  className={`flex-1 py-3.5 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-200 ${added ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-accent'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {added ? '✓ Added to Cart!' : product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleToggleWishlist}
                  disabled={wishlistLoading}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <Icon
                    name="HeartIcon"
                    size={20}
                    variant={inWishlist ? 'solid' : 'outline'}
                    className={inWishlist ? 'text-red-500' : 'text-muted-foreground'}
                  />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border">
                {[
                  { icon: 'TruckIcon', label: 'Fast Delivery', sub: 'Countrywide' },
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
                { label: 'Price', value: `${formatKES(product.price)}${product.original_price ? ` (was ${formatKES(product.original_price)})` : ''}` },
                ...(product.badge ? [{ label: 'Tag', value: product.badge }] : []),
              ].map((detail) => (
                <div key={detail.label} className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{detail.label}</span>
                  <span className="text-sm font-bold text-foreground">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-black text-foreground mb-8">
              Customer <span className="text-primary">Reviews</span>
              {reviews.length > 0 && <span className="text-muted-foreground font-medium text-lg ml-2">({reviews.length})</span>}
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Review Form */}
              <div className="lg:col-span-5">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-warm">
                  <h3 className="font-black text-foreground mb-4">
                    {userHasReviewed ? 'Your Review' : 'Write a Review'}
                  </h3>

                  {!user ? (
                    <div className="text-center py-6">
                      <Icon name="UserCircleIcon" size={40} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">Sign in to leave a review</p>
                      <Link href="/login" className="btn-primary !text-sm !px-6 !py-2.5">
                        Sign In
                      </Link>
                    </div>
                  ) : reviewSuccess || userHasReviewed ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <Icon name="CheckCircleIcon" size={24} className="text-green-500" variant="solid" />
                      </div>
                      <p className="font-bold text-foreground mb-1">Review Submitted!</p>
                      <p className="text-sm text-muted-foreground">Thank you for your feedback.</p>
                    </div>
                  ) : !canReview ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                        <Icon name="LockClosedIcon" size={24} className="text-amber-500" />
                      </div>
                      <p className="font-bold text-foreground mb-1">Purchase Required</p>
                      <p className="text-sm text-muted-foreground">You can write a review after receiving this product (order marked as delivered).</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      {/* Star Rating */}
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Your Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                              className="transition-transform hover:scale-110"
                            >
                              <Icon
                                name="StarIcon"
                                variant={star <= reviewForm.rating ? 'solid' : 'outline'}
                                size={28}
                                className={star <= reviewForm.rating ? 'text-primary' : 'text-border'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Review Title</label>
                        <input
                          type="text"
                          value={reviewForm.title}
                          onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                          placeholder="Summarize your experience"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Your Review</label>
                        <textarea
                          value={reviewForm.body}
                          onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                          placeholder="Share your thoughts about this product..."
                          rows={4}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                        />
                      </div>

                      {reviewError && (
                        <p className="text-sm text-red-600 font-medium">{reviewError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="btn-primary w-full justify-center !text-sm disabled:opacity-60"
                      >
                        {submittingReview ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Submitting…
                          </>
                        ) : (
                          <>
                            <Icon name="StarIcon" size={16} variant="solid" />
                            Submit Review
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-7">
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-secondary rounded-3xl border border-border">
                    <Icon name="StarIcon" size={40} className="text-muted-foreground mb-3" />
                    <p className="font-bold text-foreground mb-1">No reviews yet</p>
                    <p className="text-sm text-muted-foreground">Be the first to review this product!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-card border border-border rounded-2xl p-5 shadow-warm">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-foreground text-sm">
                              {review.user_profiles?.full_name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Icon
                                key={i}
                                name="StarIcon"
                                variant={i < review.rating ? 'solid' : 'outline'}
                                size={14}
                                className={i < review.rating ? 'text-primary' : 'text-border'}
                              />
                            ))}
                          </div>
                        </div>
                        {review.title && (
                          <p className="font-bold text-foreground text-sm mb-1">{review.title}</p>
                        )}
                        {review.body && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                        <p className="text-lg font-black text-foreground">{formatKES(related.price)}</p>
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

'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  badge: string;
  rating: number;
  review_count: number;
  stock_quantity: number;
  is_featured: boolean;
  categories?: { name: string; slug: string } | null;
}

// Static product fallback data (matches FeaturedProducts & ProductsClient)
const staticProducts = [
  { id: 's1', name: 'Linen Cloud Sofa', slug: 'linen-cloud-sofa', description: 'Sink into pure comfort with our Linen Cloud Sofa. Crafted from premium Belgian linen over a solid hardwood frame, this sofa combines timeless design with everyday durability. The deep cushions and rounded arms create an inviting silhouette that anchors any living room.', price: 899, original_price: 1199, image_url: 'https://img.rocket.new/generatedImages/rocket_gen_img_14cd98208-1772851737802.png', badge: 'Best Seller', rating: 4.9, review_count: 312, stock_quantity: 8, is_featured: true, categories: { name: 'Living Room', slug: 'living-room' } },
  { id: 's2', name: 'Terracotta Mug Set', slug: 'terracotta-mug-set', description: 'Start your morning right with our handcrafted Terracotta Mug Set. Each mug is individually thrown on a wheel and finished with a warm matte glaze. The set of four is perfect for family breakfasts or hosting friends for coffee.', price: 54, original_price: null, image_url: 'https://images.unsplash.com/photo-1688938675788-657ea207453a', badge: '', rating: 4.8, review_count: 189, stock_quantity: 24, is_featured: false, categories: { name: 'Kitchenware', slug: 'kitchenware' } },
  { id: 's3', name: 'Rattan Accent Chair', slug: 'rattan-accent-chair', description: 'Add natural texture and warmth to any corner with our Rattan Accent Chair. Handwoven by skilled artisans using sustainably sourced rattan, it pairs beautifully with the included cream cushion. Lightweight yet sturdy, it moves easily from room to room.', price: 349, original_price: null, image_url: 'https://images.unsplash.com/photo-1684424567465-8332058b1e6a', badge: 'New', rating: 4.7, review_count: 98, stock_quantity: 12, is_featured: false, categories: { name: 'Living Room', slug: 'living-room' } },
  { id: 's4', name: 'Linen Duvet Cover', slug: 'linen-duvet-cover', description: 'Transform your bedroom into a sanctuary with our stone-washed Linen Duvet Cover. Made from 100% European flax linen, it gets softer with every wash. The relaxed, lived-in texture and warm stone colorway complement any bedroom palette.', price: 129, original_price: 159, image_url: 'https://images.unsplash.com/photo-1721902020524-f0c0edd25f3f', badge: '', rating: 4.9, review_count: 445, stock_quantity: 30, is_featured: false, categories: { name: 'Bedroom', slug: 'bedroom' } },
  { id: 's5', name: 'Ceramic Vase Trio', slug: 'ceramic-vase-trio', description: 'Elevate your shelves and tabletops with our Ceramic Vase Trio. Three graduated sizes in complementary matte white and cream glazes create a cohesive display. Each vase is hand-finished, making every set uniquely yours.', price: 89, original_price: null, image_url: 'https://images.unsplash.com/photo-1590860778262-2d8ddead7c1a', badge: 'Popular', rating: 4.8, review_count: 221, stock_quantity: 18, is_featured: false, categories: { name: 'Décor', slug: 'decor' } },
  { id: 's6', name: 'Cast Iron Skillet', slug: 'cast-iron-skillet', description: 'Cook like a pro with our pre-seasoned Cast Iron Skillet. Exceptional heat retention and even distribution make it ideal for searing, baking, and everything in between. Naturally non-stick and built to last generations.', price: 79, original_price: null, image_url: 'https://images.unsplash.com/photo-1722795713888-60a6526b5979', badge: '', rating: 4.9, review_count: 567, stock_quantity: 40, is_featured: false, categories: { name: 'Kitchenware', slug: 'kitchenware' } },
  { id: 's7', name: 'Walnut Side Table', slug: 'walnut-side-table', description: 'The Walnut Side Table brings warmth and sophistication to any space. Crafted from solid American black walnut with hand-rubbed oil finish, the hairpin legs add a mid-century modern touch. A versatile piece that works beside a sofa, bed, or armchair.', price: 229, original_price: null, image_url: 'https://images.unsplash.com/photo-1613685302957-5f3e5dbc70c5', badge: 'New', rating: 4.7, review_count: 134, stock_quantity: 15, is_featured: false, categories: { name: 'Living Room', slug: 'living-room' } },
  { id: 's8', name: 'Woven Storage Basket', slug: 'woven-storage-basket', description: 'Keep your home tidy in style with our Woven Storage Basket. Handcrafted from natural seagrass with sturdy leather handles, it is perfect for blankets, toys, or laundry. The natural texture adds organic warmth to any room.', price: 45, original_price: null, image_url: 'https://img.rocket.new/generatedImages/rocket_gen_img_1aa9f1e87-1769498614530.png', badge: '', rating: 4.6, review_count: 88, stock_quantity: 50, is_featured: false, categories: { name: 'Décor', slug: 'decor' } },
  { id: 's9', name: 'Velvet Throw Pillow', slug: 'velvet-throw-pillow', description: 'Add a pop of rich color and luxurious texture with our Velvet Throw Pillow. The deep terracotta velvet is soft to the touch and pairs beautifully with linen and cotton textiles. Includes a removable, washable cover.', price: 39, original_price: null, image_url: 'https://images.unsplash.com/photo-1585652992436-52df88edd88a', badge: 'New', rating: 4.7, review_count: 203, stock_quantity: 35, is_featured: false, categories: { name: 'Bedroom', slug: 'bedroom' } },
  { id: 's10', name: 'Copper Pour-Over Set', slug: 'copper-pour-over-set', description: 'Elevate your coffee ritual with our Copper Pour-Over Set. The brushed copper finish adds warmth to your countertop while the precision-drilled filter ensures a clean, balanced brew. Includes gooseneck kettle, dripper, and carafe.', price: 95, original_price: null, image_url: 'https://images.unsplash.com/photo-1594409060726-0dc09d48f3dd', badge: '', rating: 4.8, review_count: 156, stock_quantity: 20, is_featured: false, categories: { name: 'Kitchenware', slug: 'kitchenware' } },
  { id: 's11', name: 'Sheepskin Area Rug', slug: 'sheepskin-area-rug', description: 'Step onto cloud-like softness every morning with our Sheepskin Area Rug. Genuine ivory sheepskin layered over a non-slip backing adds warmth and texture to hardwood or tile floors. Machine washable for easy care.', price: 189, original_price: 249, image_url: 'https://img.rocket.new/generatedImages/rocket_gen_img_1fba0851b-1772131307913.png', badge: '', rating: 4.8, review_count: 177, stock_quantity: 10, is_featured: false, categories: { name: 'Living Room', slug: 'living-room' } },
  { id: 's12', name: 'Linen Table Runner', slug: 'linen-table-runner', description: 'Set a beautiful table with our natural Linen Table Runner. Woven from stonewashed European flax, it drapes elegantly and pairs with any tableware. The frayed edges add a relaxed, artisanal touch to everyday dining.', price: 28, original_price: null, image_url: 'https://images.unsplash.com/photo-1585822027083-535befd83345', badge: '', rating: 4.5, review_count: 64, stock_quantity: 60, is_featured: false, categories: { name: 'Kitchenware', slug: 'kitchenware' } },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      setLoading(true);
      const supabase = createClient();

      // Try DB first
      const { data } = await supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .single();

      if (data) {
        setProduct(data);
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
      } else {
        // Fallback to static products
        const staticProduct = staticProducts.find((p) => p.slug === slug);
        if (staticProduct) {
          setProduct(staticProduct as Product);
          const related = staticProducts
            .filter((p) => p.categories?.slug === staticProduct.categories?.slug && p.slug !== slug)
            .slice(0, 4) as Product[];
          setRelatedProducts(related);
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

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
            {/* Image */}
            <div>
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-secondary border border-border">
                <AppImage
                  src={product.image_url}
                  alt={product.name}
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

              {/* Rating */}
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

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-black text-foreground">${product.price}</span>
                {product.original_price && (
                  <span className="text-xl text-muted-foreground line-through">${product.original_price}</span>
                )}
                {discount && (
                  <span className="text-sm font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                    Save {discount}%
                  </span>
                )}
              </div>

              {/* Description */}
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

              {/* Stock */}
              <div className="flex items-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-bold text-foreground">
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                </span>
              </div>

              {/* Quantity + Add to Cart */}
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
                    added
                      ? 'bg-green-500 text-white' :'bg-primary text-primary-foreground hover:bg-accent'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {added ? '✓ Added to Cart!' : product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border">
                {[
                  { icon: 'TruckIcon', label: 'Free Shipping', sub: 'Orders over $150' },
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

          {/* Product Details Section */}
          <div className="bg-card border border-border rounded-3xl p-8 mb-16">
            <h2 className="text-xl font-black text-foreground mb-6">Product Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Category', value: product.categories?.name || 'Uncategorized' },
                { label: 'Rating', value: `${product.rating} / 5.0 (${product.review_count} reviews)` },
                { label: 'Availability', value: product.stock_quantity > 0 ? `In Stock (${product.stock_quantity} units)` : 'Out of Stock' },
                { label: 'Price', value: `$${product.price}${product.original_price ? ` (was $${product.original_price})` : ''}` },
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
                {relatedProducts.map((related) => (
                  <Link
                    key={related.id}
                    href={`/products/${related.slug}`}
                    className="group bg-card border border-border rounded-2xl overflow-hidden shadow-warm hover:shadow-lg transition-all"
                  >
                    <div className="relative aspect-square bg-secondary overflow-hidden">
                      <AppImage
                        src={related.image_url}
                        alt={related.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-foreground text-sm leading-tight mb-1">{related.name}</p>
                      <p className="text-lg font-black text-foreground">${related.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

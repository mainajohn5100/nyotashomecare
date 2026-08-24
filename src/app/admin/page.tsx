'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

type AdminTab = 'overview' | 'products' | 'categories' | 'orders';

const KES_RATE = 130;
function formatPrice(amount: number): string {
  return `KSh ${(amount * KES_RATE).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
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
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  category_id: string | null;
  description: string;
  categories?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: string;
  user_profiles?: { full_name: string; email: string } | null;
  order_items?: { id: string; product_name: string; quantity: number; total_price: number }[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const MAX_IMAGES = 8;

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '', price: '', original_price: '', badge: '',
    stock_quantity: '0', category_id: '', is_featured: false,
    is_active: true, description: '',
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', sort_order: '0', is_active: true });
  const [categorySaving, setCategorySaving] = useState(false);

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/admin');
      return;
    }
    if (!user) return;
    const checkAdmin = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'admin') {
        setIsAdmin(true);
      } else {
        router.replace('/profile');
      }
      setCheckingRole(false);
    };
    checkAdmin();
  }, [user, authLoading, router]);

  const fetchProducts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
    if (data) setProducts(data);
  }, []);

  const fetchCategories = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data);
  }, []);

  const fetchOrders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('orders').select('*, user_profiles(full_name, email), order_items(id, product_name, quantity, total_price)').order('created_at', { ascending: false });
    if (data) setOrders(data);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingData(true);
    Promise.all([fetchProducts(), fetchCategories(), fetchOrders()]).finally(() => setLoadingData(false));
  }, [isAdmin, fetchProducts, fetchCategories, fetchOrders]);

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;
    const remaining = MAX_IMAGES - uploadedImages.length;
    if (remaining <= 0) {
      setFormError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setFormError('');
    try {
      const supabase = createClient();
      const newUrls: string[] = [];
      for (const file of toUpload) {
        const ext = file.name.split('.').pop();
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      setUploadedImages((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const openProductForm = (product?: Product) => {
    setFormError('');
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name, price: String(product.price),
        original_price: product.original_price ? String(product.original_price) : '',
        badge: product.badge || '', stock_quantity: String(product.stock_quantity),
        category_id: product.category_id || '', is_featured: product.is_featured,
        is_active: product.is_active, description: product.description || '',
      });
      const imgs: string[] = [];
      if (product.images && product.images.length > 0) imgs.push(...product.images);
      else if (product.image_url) imgs.push(product.image_url);
      setUploadedImages(imgs);
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', price: '', original_price: '', badge: '', stock_quantity: '0', category_id: '', is_featured: false, is_active: true, description: '' });
      setUploadedImages([]);
    }
    setShowProductForm(true);
  };

  const saveProduct = async () => {
    setFormError('');
    if (!productForm.name || !productForm.price) { setFormError('Name and price are required'); return; }
    setProductSaving(true);
    try {
      const supabase = createClient();
      const slug = productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
      const payload = {
        name: productForm.name,
        slug: editingProduct ? editingProduct.slug : slug,
        price: parseFloat(productForm.price),
        original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
        image_url: uploadedImages[0] || '',
        images: uploadedImages,
        badge: productForm.badge,
        stock_quantity: parseInt(productForm.stock_quantity) || 0,
        category_id: productForm.category_id || null,
        is_featured: productForm.is_featured,
        is_active: productForm.is_active,
        description: productForm.description,
      };
      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
      await fetchProducts();
      setShowProductForm(false);
      setUploadedImages([]);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setProductSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const supabase = createClient();
    await supabase.from('products').delete().eq('id', id);
    await fetchProducts();
  };

  const openCategoryForm = (cat?: Category) => {
    setFormError('');
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({ name: cat.name, slug: cat.slug, description: cat.description || '', sort_order: String(cat.sort_order), is_active: cat.is_active });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', slug: '', description: '', sort_order: '0', is_active: true });
    }
    setShowCategoryForm(true);
  };

  const saveCategory = async () => {
    setFormError('');
    if (!categoryForm.name || !categoryForm.slug) { setFormError('Name and slug are required'); return; }
    setCategorySaving(true);
    try {
      const supabase = createClient();
      const payload = { name: categoryForm.name, slug: categoryForm.slug, description: categoryForm.description, sort_order: parseInt(categoryForm.sort_order) || 0, is_active: categoryForm.is_active };
      if (editingCategory) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }
      await fetchCategories();
      setShowCategoryForm(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save category');
    } finally {
      setCategorySaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    const supabase = createClient();
    await supabase.from('categories').delete().eq('id', id);
    await fetchCategories();
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const supabase = createClient();
    await supabase.from('orders').update({ status }).eq('id', orderId);
    await fetchOrders();
  };

  if (authLoading || checkingRole) {
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

  if (!isAdmin) return null;

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your store — Nyotas Homecare</p>
            </div>
            <Link href="/profile" className="btn-secondary !px-5 !py-2.5 !text-xs">
              <Icon name="UserIcon" size={16} />
              My Profile
            </Link>
          </div>

          <div className="flex gap-1 bg-secondary rounded-full p-1 w-fit mb-8 border border-border overflow-x-auto">
            {(['overview', 'products', 'categories', 'orders'] as AdminTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {loadingData && activeTab !== 'overview' ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'Total Products', value: products.length, icon: 'ArchiveBoxIcon', color: 'text-blue-600' },
                      { label: 'Categories', value: categories.length, icon: 'TagIcon', color: 'text-purple-600' },
                      { label: 'Total Orders', value: orders.length, icon: 'ShoppingBagIcon', color: 'text-orange-600' },
                      { label: 'Revenue', value: formatPrice(totalRevenue), icon: 'CurrencyDollarIcon', color: 'text-green-600' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-card border border-border rounded-2xl p-5 shadow-warm">
                        <Icon name={stat.icon as any} size={24} className={`${stat.color} mb-3`} />
                        <p className="text-2xl font-black text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-warm">
                      <h3 className="font-black text-foreground mb-4">Recent Orders</h3>
                      <div className="space-y-3">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <div>
                              <p className="text-sm font-bold text-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-xs text-muted-foreground">{order.user_profiles?.full_name || 'Guest'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${statusColors[order.status] || ''}`}>{order.status}</span>
                              <span className="text-sm font-black text-foreground">{formatPrice(order.total_amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-warm">
                      <h3 className="font-black text-foreground mb-4">Quick Actions</h3>
                      <div className="space-y-3">
                        <button onClick={() => { setActiveTab('products'); openProductForm(); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-primary/10 transition-colors text-left">
                          <Icon name="PlusCircleIcon" size={20} className="text-primary" />
                          <span className="font-bold text-foreground text-sm">Add New Product</span>
                        </button>
                        <button onClick={() => { setActiveTab('categories'); openCategoryForm(); }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-primary/10 transition-colors text-left">
                          <Icon name="PlusCircleIcon" size={20} className="text-primary" />
                          <span className="font-bold text-foreground text-sm">Add New Category</span>
                        </button>
                        <button onClick={() => setActiveTab('orders')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-primary/10 transition-colors text-left">
                          <Icon name="ClipboardDocumentListIcon" size={20} className="text-primary" />
                          <span className="font-bold text-foreground text-sm">View All Orders</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-black text-foreground">Products ({products.length})</h2>
                    <button onClick={() => openProductForm()} className="btn-primary !px-5 !py-2.5 !text-xs">
                      <Icon name="PlusIcon" size={16} />
                      Add Product
                    </button>
                  </div>

                  {showProductForm && (
                    <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-warm">
                      <h3 className="font-black text-foreground mb-4">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                      {formError && <p className="text-red-600 text-sm mb-4">{formError}</p>}

                      {/* Image Upload */}
                      <div className="mb-5">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                          Product Images ({uploadedImages.length}/{MAX_IMAGES})
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {uploadedImages.map((url, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                              <AppImage src={url} alt={`Product image ${idx + 1}`} width={80} height={80} className="object-cover w-full h-full" />
                              <button
                                onClick={() => removeImage(idx)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                <Icon name="XMarkIcon" size={16} className="text-white" />
                              </button>
                              {idx === 0 && (
                                <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[8px] font-black text-center py-0.5">MAIN</span>
                              )}
                            </div>
                          ))}
                          {uploadedImages.length < MAX_IMAGES && (
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
                            >
                              {uploading ? (
                                <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : (
                                <>
                                  <Icon name="PlusIcon" size={20} className="text-muted-foreground" />
                                  <span className="text-[9px] text-muted-foreground font-bold">Upload</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          className="hidden"
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        />
                        <p className="text-xs text-muted-foreground">Upload up to {MAX_IMAGES} images. First image is the main product image. JPG, PNG, WebP supported.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {[
                          { label: 'Product Name *', key: 'name', type: 'text', placeholder: 'e.g. Linen Cloud Sofa' },
                          { label: 'Price (USD) *', key: 'price', type: 'number', placeholder: '0.00' },
                          { label: 'Original Price (USD)', key: 'original_price', type: 'number', placeholder: '0.00' },
                          { label: 'Stock Quantity', key: 'stock_quantity', type: 'number', placeholder: '0' },
                          { label: 'Badge', key: 'badge', type: 'text', placeholder: 'e.g. New, Best Seller' },
                        ].map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{field.label}</label>
                            <input
                              type={field.type}
                              value={(productForm as any)[field.key]}
                              onChange={(e) => setProductForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder={field.placeholder}
                              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                        ))}
                        <div>
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Category</label>
                          <select
                            value={productForm.category_id}
                            onChange={(e) => setProductForm((prev) => ({ ...prev, category_id: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          >
                            <option value="">No category</option>
                            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Description</label>
                        <textarea
                          value={productForm.description}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Product description..."
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-6 mb-5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={productForm.is_featured} onChange={(e) => setProductForm((prev) => ({ ...prev, is_featured: e.target.checked }))} className="w-4 h-4 accent-primary" />
                          <span className="text-sm font-bold text-foreground">Featured</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={productForm.is_active} onChange={(e) => setProductForm((prev) => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                          <span className="text-sm font-bold text-foreground">Active</span>
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => { setShowProductForm(false); setUploadedImages([]); }} className="px-5 py-2.5 rounded-full border border-border text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                        <button onClick={saveProduct} disabled={productSaving || uploading} className="btn-primary !px-6 !py-2.5 !text-sm disabled:opacity-60">
                          {productSaving ? 'Saving…' : editingProduct ? 'Update Product' : 'Add Product'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-warm">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-secondary">
                            <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Product</th>
                            <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Category</th>
                            <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Price</th>
                            <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Stock</th>
                            <th className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="text-right px-5 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product) => {
                            const displayImg = (product.images && product.images.length > 0) ? product.images[0] : product.image_url;
                            return (
                              <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                                      <AppImage src={displayImg || '/assets/images/no_image.png'} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-foreground text-sm">{product.name}</p>
                                      {product.badge && <span className="text-xs text-primary font-bold">{product.badge}</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-sm text-muted-foreground">{product.categories?.name || '—'}</td>
                                <td className="px-5 py-4">
                                  <p className="font-bold text-foreground text-sm">{formatPrice(product.price)}</p>
                                  {product.original_price && <p className="text-xs text-muted-foreground line-through">{formatPrice(product.original_price)}</p>}
                                </td>
                                <td className="px-5 py-4 text-sm text-foreground font-bold">{product.stock_quantity}</td>
                                <td className="px-5 py-4">
                                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => openProductForm(product)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                                      <Icon name="PencilIcon" size={14} />
                                    </button>
                                    <button onClick={() => deleteProduct(product.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600">
                                      <Icon name="TrashIcon" size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-black text-foreground">Categories ({categories.length})</h2>
                    <button onClick={() => openCategoryForm()} className="btn-primary !px-5 !py-2.5 !text-xs">
                      <Icon name="PlusIcon" size={16} />
                      Add Category
                    </button>
                  </div>

                  {showCategoryForm && (
                    <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-warm">
                      <h3 className="font-black text-foreground mb-4">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                      {formError && <p className="text-red-600 text-sm mb-4">{formError}</p>}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {[
                          { label: 'Name *', key: 'name', placeholder: 'e.g. Living Room' },
                          { label: 'Slug *', key: 'slug', placeholder: 'e.g. living-room' },
                          { label: 'Description', key: 'description', placeholder: 'Short description' },
                          { label: 'Sort Order', key: 'sort_order', placeholder: '0' },
                        ].map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{field.label}</label>
                            <input
                              type="text"
                              value={(categoryForm as any)[field.key]}
                              onChange={(e) => setCategoryForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                              placeholder={field.placeholder}
                              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                        ))}
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer mb-5">
                        <input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm((prev) => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                        <span className="text-sm font-bold text-foreground">Active</span>
                      </label>
                      <div className="flex gap-3">
                        <button onClick={() => setShowCategoryForm(false)} className="px-5 py-2.5 rounded-full border border-border text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                        <button onClick={saveCategory} disabled={categorySaving} className="btn-primary !px-6 !py-2.5 !text-sm disabled:opacity-60">
                          {categorySaving ? 'Saving…' : editingCategory ? 'Update Category' : 'Add Category'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                      <div key={cat.id} className="bg-card border border-border rounded-2xl p-5 shadow-warm">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-black text-foreground">{cat.name}</h3>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">/{cat.slug}</p>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {cat.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {cat.description && <p className="text-sm text-muted-foreground mb-4">{cat.description}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => openCategoryForm(cat)} className="flex-1 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-1.5">
                            <Icon name="PencilIcon" size={12} /> Edit
                          </button>
                          <button onClick={() => deleteCategory(cat.id)} className="flex-1 py-2 rounded-xl border border-red-200 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5">
                            <Icon name="TrashIcon" size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-xl font-black text-foreground mb-5">Orders ({orders.length})</h2>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-card border border-border rounded-2xl p-6 shadow-warm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div>
                            <p className="font-black text-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground">{order.user_profiles?.full_name || 'Guest'} · {order.user_profiles?.email}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(order.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="px-3 py-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                              {ORDER_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                            <span className="text-lg font-black text-foreground">{formatPrice(order.total_amount)}</span>
                          </div>
                        </div>
                        {order.order_items && order.order_items.length > 0 && (
                          <div className="border-t border-border pt-3 space-y-2">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm">
                                <span className="text-foreground">{item.product_name} × {item.quantity}</span>
                                <span className="font-bold text-foreground">{formatPrice(item.total_price)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

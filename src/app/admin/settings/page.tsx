'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface HeroSlide {
  id: string;
  sort_order: number;
  headline_line1: string;
  headline_line2: string;
  label: string;
  tag: string;
  price_from: string;
  images: string[];
  category_id: string | null;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

const MAX_HERO_IMAGES = 4;
const MAX_HERO_SLIDES = 6;

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [savingSlide, setSavingSlide] = useState<string | null>(null);
  const [deletingSlide, setDeletingSlide] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showSlideForm, setShowSlideForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [slideForm, setSlideForm] = useState({
    headline_line1: '',
    headline_line2: '',
    label: '',
    tag: '',
    price_from: '',
    category_id: '',
    is_active: true,
    sort_order: '0',
  });
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editingSlideIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/admin/settings');
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

  const fetchSlides = useCallback(async () => {
    setLoadingSlides(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('hero_settings')
      .select('*')
      .order('sort_order');
    if (data) setSlides(data);
    setLoadingSlides(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from('categories').select('id, name, slug, is_active').order('sort_order');
    if (data) setCategories(data);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchSlides();
    fetchCategories();
  }, [isAdmin, fetchSlides, fetchCategories]);

  const handleHeroImageUpload = async (files: FileList, slideId?: string) => {
    if (!files.length) return;
    const currentImages = slideId
      ? (slides.find(s => s.id === slideId)?.images || [])
      : slideImages;
    const remaining = MAX_HERO_IMAGES - currentImages.length;
    if (remaining <= 0) {
      setFormError(`Maximum ${MAX_HERO_IMAGES} images per slide`);
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploadingFor(slideId || 'new');
    setFormError('');
    try {
      const supabase = createClient();
      const newUrls: string[] = [];
      for (const file of toUpload) {
        const ext = file.name.split('.').pop();
        const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      if (slideId) {
        // Update existing slide images directly
        const existing = slides.find(s => s.id === slideId);
        if (existing) {
          const updated = [...existing.images, ...newUrls];
          const supabase2 = createClient();
          await supabase2.from('hero_settings').update({ images: updated }).eq('id', slideId);
          await fetchSlides();
        }
      } else {
        setSlideImages(prev => [...prev, ...newUrls]);
      }
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed');
    } finally {
      setUploadingFor(null);
    }
  };

  const removeHeroImage = async (slideId: string, imgIdx: number) => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;
    const updated = slide.images.filter((_, i) => i !== imgIdx);
    const supabase = createClient();
    await supabase.from('hero_settings').update({ images: updated }).eq('id', slideId);
    await fetchSlides();
  };

  const openSlideForm = (slide?: HeroSlide) => {
    setFormError('');
    if (slide) {
      setEditingSlide(slide);
      editingSlideIdRef.current = slide.id;
      setSlideForm({
        headline_line1: slide.headline_line1,
        headline_line2: slide.headline_line2,
        label: slide.label,
        tag: slide.tag,
        price_from: slide.price_from,
        category_id: slide.category_id || '',
        is_active: slide.is_active,
        sort_order: String(slide.sort_order),
      });
      setSlideImages(slide.images || []);
    } else {
      setEditingSlide(null);
      editingSlideIdRef.current = null;
      setSlideForm({
        headline_line1: '',
        headline_line2: '',
        label: '',
        tag: '',
        price_from: '',
        category_id: '',
        is_active: true,
        sort_order: String(slides.length),
      });
      setSlideImages([]);
    }
    setShowSlideForm(true);
  };

  const saveSlide = async () => {
    setFormError('');
    if (!slideForm.headline_line1 || !slideForm.headline_line2) {
      setFormError('Both headline lines are required');
      return;
    }
    setSavingSlide(editingSlide?.id || 'new');
    try {
      const supabase = createClient();
      const payload = {
        headline_line1: slideForm.headline_line1,
        headline_line2: slideForm.headline_line2,
        label: slideForm.label,
        tag: slideForm.tag,
        price_from: slideForm.price_from,
        category_id: slideForm.category_id || null,
        is_active: slideForm.is_active,
        sort_order: parseInt(slideForm.sort_order) || 0,
        images: slideImages,
      };
      if (editingSlide) {
        const { error } = await supabase.from('hero_settings').update(payload).eq('id', editingSlide.id);
        if (error) throw error;
      } else {
        if (slides.length >= MAX_HERO_SLIDES) {
          setFormError(`Maximum ${MAX_HERO_SLIDES} hero slides allowed`);
          setSavingSlide(null);
          return;
        }
        const { error } = await supabase.from('hero_settings').insert(payload);
        if (error) throw error;
      }
      await fetchSlides();
      setShowSlideForm(false);
      setSlideImages([]);
      setSuccessMsg('Hero slide saved!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save slide');
    } finally {
      setSavingSlide(null);
    }
  };

  const deleteSlide = async (id: string) => {
    if (!confirm('Delete this hero slide?')) return;
    setDeletingSlide(id);
    const supabase = createClient();
    await supabase.from('hero_settings').delete().eq('id', id);
    await fetchSlides();
    setDeletingSlide(null);
  };

  const toggleSlideActive = async (slide: HeroSlide) => {
    const supabase = createClient();
    await supabase.from('hero_settings').update({ is_active: !slide.is_active }).eq('id', slide.id);
    await fetchSlides();
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link href="/admin" className="hover:text-foreground font-medium transition-colors">Admin Dashboard</Link>
            <Icon name="ChevronRightIcon" size={12} />
            <span className="text-foreground font-bold">Settings</span>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">Store Settings</h1>
              <p className="text-muted-foreground mt-1">Configure hero section, featured categories, and display options</p>
            </div>
            <Link href="/admin" className="btn-secondary !px-5 !py-2.5 !text-xs">
              <Icon name="ArrowLeftIcon" size={16} />
              Back to Dashboard
            </Link>
          </div>

          {successMsg && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold">
              <Icon name="CheckCircleIcon" size={18} className="text-green-600" />
              {successMsg}
            </div>
          )}

          {/* Hero Section Settings */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-warm mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-foreground">Hero Section Slides</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure up to {MAX_HERO_SLIDES} hero slides. Each slide can have up to {MAX_HERO_IMAGES} images that auto-cycle on hover.
                </p>
              </div>
              {slides.length < MAX_HERO_SLIDES && (
                <button onClick={() => openSlideForm()} className="btn-primary !px-5 !py-2.5 !text-xs">
                  <Icon name="PlusIcon" size={16} />
                  Add Slide
                </button>
              )}
            </div>

            {/* Slide Form */}
            {showSlideForm && (
              <div className="bg-secondary border border-border rounded-2xl p-6 mb-6">
                <h3 className="font-black text-foreground mb-4">{editingSlide ? 'Edit Slide' : 'New Hero Slide'}</h3>
                {formError && <p className="text-red-600 text-sm mb-4 bg-red-50 px-4 py-2 rounded-xl">{formError}</p>}

                {/* Image Upload */}
                <div className="mb-5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    Slide Images ({slideImages.length}/{MAX_HERO_IMAGES}) — auto-cycle on hover
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {slideImages.map((url, idx) => (
                      <div key={idx} className="relative w-24 h-16 rounded-xl overflow-hidden border border-border group">
                        <AppImage src={url} alt={`Hero image ${idx + 1}`} width={96} height={64} className="object-cover w-full h-full" />
                        <button
                          onClick={() => setSlideImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <Icon name="XMarkIcon" size={16} className="text-white" />
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[8px] font-black text-center py-0.5">MAIN</span>
                        )}
                      </div>
                    ))}
                    {slideImages.length < MAX_HERO_IMAGES && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFor === 'new'}
                        className="w-24 h-16 rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
                      >
                        {uploadingFor === 'new' ? (
                          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <>
                            <Icon name="PhotoIcon" size={18} className="text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground font-bold">Upload</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleHeroImageUpload(e.target.files)}
                  />
                  <p className="text-xs text-muted-foreground">Upload up to {MAX_HERO_IMAGES} images. They will auto-cycle when this slide is active.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {[
                    { label: 'Headline Line 1 *', key: 'headline_line1', placeholder: 'e.g. Living Room' },
                    { label: 'Headline Line 2 *', key: 'headline_line2', placeholder: 'e.g. Reinvented' },
                    { label: 'Label', key: 'label', placeholder: 'e.g. New Collection' },
                    { label: 'Tag', key: 'tag', placeholder: 'e.g. Furniture' },
                    { label: 'Price From', key: 'price_from', placeholder: 'e.g. From KSh 38,870' },
                    { label: 'Sort Order', key: 'sort_order', placeholder: '0' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{field.label}</label>
                      <input
                        type="text"
                        value={(slideForm as any)[field.key]}
                        onChange={(e) => setSlideForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Linked Category</label>
                    <select
                      value={slideForm.category_id}
                      onChange={(e) => setSlideForm(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">No category link</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">Clicking "Explore" on this slide will go to this category.</p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mb-5">
                  <input
                    type="checkbox"
                    checked={slideForm.is_active}
                    onChange={(e) => setSlideForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-bold text-foreground">Active (visible on homepage)</span>
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowSlideForm(false); setSlideImages([]); }}
                    className="px-5 py-2.5 rounded-full border border-border text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSlide}
                    disabled={!!savingSlide}
                    className="btn-primary !px-6 !py-2.5 !text-sm disabled:opacity-60"
                  >
                    {savingSlide ? 'Saving…' : editingSlide ? 'Update Slide' : 'Add Slide'}
                  </button>
                </div>
              </div>
            )}

            {/* Slides List */}
            {loadingSlides ? (
              <div className="flex items-center justify-center py-10">
                <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : slides.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Icon name="PhotoIcon" size={40} className="mx-auto mb-3" />
                <p className="text-sm">No hero slides yet. Add your first slide above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {slides.map((slide) => (
                  <div key={slide.id} className="bg-background border border-border rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
                    {/* Images preview */}
                    <div className="flex gap-2 flex-shrink-0">
                      {slide.images.slice(0, 4).map((img, i) => (
                        <div key={i} className="relative w-16 h-12 rounded-lg overflow-hidden border border-border group">
                          <AppImage src={img} alt={`Slide ${i + 1}`} width={64} height={48} className="object-cover w-full h-full" />
                          <button
                            onClick={() => removeHeroImage(slide.id, i)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          >
                            <Icon name="XMarkIcon" size={12} className="text-white" />
                          </button>
                        </div>
                      ))}
                      {slide.images.length < MAX_HERO_IMAGES && (
                        <label className="w-16 h-12 rounded-lg border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors">
                          {uploadingFor === slide.id ? (
                            <svg className="animate-spin h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <Icon name="PlusIcon" size={16} className="text-muted-foreground" />
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleHeroImageUpload(e.target.files, slide.id)}
                          />
                        </label>
                      )}
                    </div>

                    {/* Slide info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-black text-foreground text-sm">
                            {slide.headline_line1} <span className="text-primary">{slide.headline_line2}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {slide.label} · {slide.tag} · {slide.price_from}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {slide.images.length} image{slide.images.length !== 1 ? 's' : ''} · Order: {slide.sort_order}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleSlideActive(slide)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                              slide.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {slide.is_active ? 'Active' : 'Hidden'}
                          </button>
                          <button
                            onClick={() => openSlideForm(slide)}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Icon name="PencilIcon" size={14} />
                          </button>
                          <button
                            onClick={() => deleteSlide(slide.id)}
                            disabled={deletingSlide === slide.id}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600 disabled:opacity-50"
                          >
                            <Icon name="TrashIcon" size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Display Settings */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-warm">
            <h2 className="text-xl font-black text-foreground mb-2">Category Display</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Manage which categories appear in the hero section and collections. Go to{' '}
              <Link href="/admin" className="text-primary font-bold hover:underline">Admin → Categories</Link>{' '}
              to add, edit, or reorder categories. Active categories automatically appear in the Collections page as horizontally scrollable rows.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl border border-border">
                  <div>
                    <p className="text-sm font-bold text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">/{cat.slug}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {cat.is_active ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-3">No categories yet. Add them from the Admin Dashboard.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

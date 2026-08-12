'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    product_image: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  role: string;
  avatar_url: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '', address: '' });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/profile');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoadingData(true);
      const supabase = createClient();
      try {
        const [profileRes, ordersRes] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('id', user.id).single(),
          supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
        ]);
        if (profileRes.data) {
          setProfile(profileRes.data);
          setFormData({
            full_name: profileRes.data.full_name || '',
            phone: profileRes.data.phone || '',
            address: profileRes.data.address || '',
          });
        }
        if (ordersRes.data) setOrders(ordersRes.data);
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('user_profiles')
        .update({ full_name: formData.full_name, phone: formData.phone, address: formData.address })
        .eq('id', user.id);
      if (error) throw error;
      setProfile((prev) => prev ? { ...prev, ...formData } : prev);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  if (authLoading || loadingData) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-background pt-20">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-muted-foreground">Loading your profile…</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">My Account</h1>
              <p className="text-muted-foreground mt-1">{profile?.email}</p>
            </div>
            <div className="flex items-center gap-3">
              {profile?.role === 'admin' && (
                <Link href="/admin" className="btn-secondary !px-5 !py-2.5 !text-xs">
                  <Icon name="Cog6ToothIcon" size={16} />
                  Admin Dashboard
                </Link>
              )}
              <button onClick={handleSignOut} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Icon name="ArrowRightOnRectangleIcon" size={16} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-secondary rounded-full p-1 w-fit mb-8 border border-border">
            {(['profile', 'orders'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full text-sm font-bold capitalize transition-all ${
                  activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'orders' ? `Orders (${orders.length})` : 'Profile'}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-warm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-foreground">Personal Information</h2>
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="btn-secondary !px-5 !py-2 !text-xs">
                    <Icon name="PencilIcon" size={14} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-full border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} className="btn-primary !px-5 !py-2 !text-xs disabled:opacity-60">
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
                  <Icon name="CheckCircleIcon" size={16} />
                  Profile updated successfully!
                </div>
              )}
              {saveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
                  {saveError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Your full name' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: '', readOnly: true },
                  { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
                  { label: 'Address', key: 'address', type: 'text', placeholder: '123 Main St, City, State' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{field.label}</label>
                    <input
                      type={field.type}
                      value={field.key === 'email' ? (profile?.email || '') : (formData as any)[field.key] || ''}
                      onChange={(e) => !field.readOnly && setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      readOnly={!editing || field.readOnly}
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-3 rounded-xl border text-foreground text-sm transition-all ${
                        editing && !field.readOnly
                          ? 'border-primary/40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/40' :'border-border bg-secondary cursor-default'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Account role: <span className="font-bold text-foreground capitalize">{profile?.role}</span>
                </p>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                  <Icon name="ShoppingBagIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-black text-foreground mb-2">No orders yet</h3>
                  <p className="text-muted-foreground mb-6">Start shopping to see your orders here.</p>
                  <Link href="/products" className="btn-primary">Shop Now</Link>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-card border border-border rounded-2xl p-6 shadow-warm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${statusColors[order.status] || 'bg-secondary text-foreground'}`}>
                          {order.status}
                        </span>
                        <span className="text-lg font-black text-foreground">${order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                            <AppImage src={item.product_image} alt={item.product_name} width={56} height={56} className="object-cover w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-sm truncate">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ${item.unit_price.toFixed(2)}</p>
                          </div>
                          <p className="font-black text-foreground text-sm">${item.total_price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface CartBadgeProps {
  count: number;
}

function CartBadge({ count }: CartBadgeProps) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
      {count}
    </span>
  );
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount] = useState(2);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!user) { setUserRole(null); return; }
    const fetchRole = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('user_profiles').select('role').eq('id', user.id).single();
      if (data) setUserRole(data.role);
    };
    fetchRole();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
    setMobileOpen(false);
  };

  const navLinks = [
    { label: 'Shop', href: '/products' },
    { label: 'Collections', href: '/products' },
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: '/#contact' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/90 backdrop-blur-xl border-b border-border shadow-warm'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <AppLogo
              size={36}
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-xl font-black tracking-tight text-foreground">
              Home<span className="text-primary">Vibe</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 px-5 py-2 bg-secondary rounded-full border border-border">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Search"
              className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Icon name="MagnifyingGlassIcon" size={20} />
            </button>

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Icon name="ShoppingBagIcon" size={20} />
              <CartBadge count={cartCount} />
            </Link>

            {/* Auth buttons */}
            {!authLoading && (
              <>
                {user ? (
                  <div className="hidden sm:flex items-center gap-2">
                    {userRole === 'admin' && (
                      <Link href="/admin" className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted border border-border">
                        Admin
                      </Link>
                    )}
                    <Link href="/profile" className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm hover:bg-accent transition-colors">
                      {user.email?.charAt(0).toUpperCase()}
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex btn-primary !px-6 !py-2.5 !text-[10px]"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}

            {/* Mobile Hamburger */}
            <button
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <Icon name={mobileOpen ? 'XMarkIcon' : 'Bars3Icon'} size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col pt-24 px-8 pb-10"
          onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}
        >
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-3xl font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors py-3 border-b border-border"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="text-3xl font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors py-3 border-b border-border"
                >
                  My Profile
                </Link>
                {userRole === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="text-3xl font-black uppercase tracking-tight text-foreground hover:text-primary transition-colors py-3 border-b border-border"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            {user ? (
              <button
                onClick={handleSignOut}
                className="btn-secondary w-full justify-center text-sm"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full justify-center text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-secondary w-full justify-center text-sm"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
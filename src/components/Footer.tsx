import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

export default function Footer() {
  return (
    <footer className="border-t border-border py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          {/* Left: Logo + Tagline */}
          <div className="flex flex-col gap-3 max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <AppLogo size={32} />
              <span className="text-lg font-black tracking-tight text-foreground">
                Nyotas&nbsp;<span className="text-primary">Homecare</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Essentials for Every Home.
            </p>
          </div>
 
          {/* Right: Links */}
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <Link href="/products" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Shop
            </Link>
            <Link href="/collections" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Collections
            </Link>
            <Link href="/#about" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/#contact" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link href="/cart" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cart
            </Link>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Nyotas&nbsp;<span className="text-primary">Homecare</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Instagram" className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all">
                <Icon name="HeartIcon" size={16} />
              </a>
              <a href="#" aria-label="Twitter" className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all">
                <Icon name="ChatBubbleLeftIcon" size={16} />
              </a>
              <a href="#" aria-label="Pinterest" className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-all">
                <Icon name="BookmarkIcon" size={16} />
              </a>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
              <span>·</span>
              <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
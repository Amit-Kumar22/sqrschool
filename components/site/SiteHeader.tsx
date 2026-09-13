'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Menu, X } from 'lucide-react';
import type { WebsiteHeader } from '@/lib/websiteSettingService';
import type { WebsiteNavigationItem } from '@/lib/freeService';
import SiteImage from './SiteImage';

interface SiteHeaderProps {
  header: WebsiteHeader | null;
  navItems: WebsiteNavigationItem[];
  schoolName: string;
  tagline: string;
}

/** Sticky masthead — logo lockup, CMS navigation and the enquiry call-to-action. Condenses once the page scrolls. */
export default function SiteHeader({ header, navItems, schoolName, tagline }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Only the phone menu is CMS-toggleable; the desktop nav always renders.
  const mobileMenuEnabled = header?.mobileMenuEnabled !== false;

  return (
    <header
      className={`sticky top-0 z-50 bg-navbar-bg text-navbar-text transition-shadow duration-300 ${
        scrolled ? 'shadow-premium-lg' : 'shadow-premium-sm'
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 ${
          scrolled ? 'h-16' : 'h-20'
        }`}
      >
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          {header?.logoUrl ? (
            <SiteImage
              src={header.logoUrl}
              alt={header.logoAlt || `${schoolName} logo`}
              fallback="/images/building.jpg"
              className={`shrink-0 rounded-full bg-white object-contain p-0.5 shadow-premium-sm transition-all duration-300 ${
                scrolled ? 'h-10 w-10' : 'h-12 w-12'
              }`}
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-button-bg to-button-bg/70 text-button-text shadow-glow-button">
              <GraduationCap size={22} />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-base font-bold uppercase leading-tight tracking-wide sm:text-lg">
              {schoolName}
            </span>
            {tagline && (
              <span className="block truncate text-[11px] font-medium tracking-wide opacity-70">{tagline}</span>
            )}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 xl:flex">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.url || '#'}
              className="group relative py-1 text-[13px] font-semibold uppercase tracking-wide opacity-90 transition-opacity hover:opacity-100"
            >
              {item.label}
              <span className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-left scale-x-0 bg-button-bg transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* The portal sign-in, not the CMS enquiry CTA — that one still runs
              the announcement/about/why-choose buttons further down the page. */}
          <Link
            href="/login"
            className="hidden items-center gap-1.5 rounded-full bg-button-bg px-6 py-2.5 text-[13px] font-bold uppercase tracking-wide text-button-text shadow-glow-button transition-all hover:-translate-y-0.5 hover:shadow-glow-button-lg sm:inline-flex"
          >
            Login <ArrowRight size={15} />
          </Link>

          {mobileMenuEnabled && (
            <button
              type="button"
              className="rounded-md p-1.5 transition-colors hover:bg-current/10 xl:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {mobileMenuEnabled && (
        <div
          className={`overflow-hidden border-t border-current/15 bg-navbar-bg/95 backdrop-blur-md transition-[max-height,opacity] duration-300 xl:hidden ${
            open ? 'max-h-[28rem] opacity-100 shadow-premium-lg' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="flex flex-col gap-1 px-4 pt-2 pb-4 text-sm">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.url || '#'}
                className="rounded px-2 py-2 font-medium uppercase tracking-wide opacity-90 transition-colors hover:bg-current/10 hover:opacity-100"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-button-bg px-4 py-2.5 text-center font-bold uppercase tracking-wide text-button-text shadow-glow-button"
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

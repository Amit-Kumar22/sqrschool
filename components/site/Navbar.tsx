'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Academics', href: '#academics' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Admissions', href: '#admissions' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b text-navbar-text transition-all duration-300 ${
        scrolled
          ? 'border-white/10 bg-navbar-bg/90 shadow-premium-lg backdrop-blur-md'
          : 'border-white/0 bg-navbar-bg shadow-premium-sm'
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-4 transition-all duration-300 sm:px-6 ${
          scrolled ? 'h-12' : 'h-14'
        }`}
      >
        <Link href="/" className="group flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-button-bg to-button-bg/70 text-button-text shadow-glow-button transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:shadow-glow-button-lg">
            <GraduationCap size={18} />
          </span>
          <span className="text-[15px] tracking-tight">{theme.companyName || 'SQR School'}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="group relative py-1 opacity-90 hover:opacity-100">
              {link.label}
              <span className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-left scale-x-0 bg-button-bg transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-md bg-button-bg px-4 py-1.5 text-sm font-medium text-button-text shadow-glow-button transition-all hover:-translate-y-0.5 hover:shadow-glow-button-lg"
          >
            Login
          </Link>
        </div>

        <button
          className="rounded-md p-1 transition-colors hover:bg-white/10 md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        className={`overflow-hidden border-t border-white/10 bg-navbar-bg/95 backdrop-blur-md transition-[max-height,opacity] duration-300 md:hidden ${
          open ? 'max-h-80 opacity-100 shadow-premium-lg' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 pt-2 pb-3 text-sm">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded px-2 py-2 opacity-90 transition-colors hover:bg-white/10 hover:opacity-100"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="mt-1 rounded-md bg-button-bg px-3 py-2 text-center font-medium text-button-text shadow-glow-button"
            onClick={() => setOpen(false)}
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

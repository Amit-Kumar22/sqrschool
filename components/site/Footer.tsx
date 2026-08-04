'use client';

import Link from 'next/link';
import { ArrowUp, GraduationCap, Mail, MapPin, Phone } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

// lucide-react ships no brand icons, so social glyphs are small inline SVGs.
const SOCIALS = [
  {
    label: 'Facebook',
    href: '#',
    path: 'M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.3-1.5 1.6-1.5H16.5V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10.5H7.5v3H9.8V21h3.7z',
  },
  {
    label: 'Instagram',
    href: '#',
    path: 'M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4zm0 6.1a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8zM16 4H8a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4zm2.7 12a2.7 2.7 0 0 1-2.7 2.7H8A2.7 2.7 0 0 1 5.3 16V8A2.7 2.7 0 0 1 8 5.3h8A2.7 2.7 0 0 1 18.7 8v8zM16.4 7.6a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8z',
  },
  {
    label: 'X',
    href: '#',
    path: 'M13.6 10.6 19.9 4h-1.5l-5.5 5.7L8.5 4H4l6.6 8.9L4 20h1.5l5.8-6 4.7 6H20l-6.4-9.4zM11.6 13l-.7-.9L6 6h2.3l4.3 5.8.7.9 5.6 7.5h-2.3L11.6 13z',
  },
  {
    label: 'YouTube',
    href: '#',
    path: 'M21.6 8.2a2.7 2.7 0 0 0-1.9-1.9C18 5.8 12 5.8 12 5.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 8.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 3.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-3.8zM10 14.8V9.2L15 12l-5 2.8z',
  },
];

const QUICK_LINKS = [
  { label: 'About Us', href: '#about' },
  { label: 'Academics', href: '#academics' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Admissions', href: '#admissions' },
];

const PROGRAMS = ['Primary School', 'Middle School', 'Secondary School', 'Sports & Activities'];

export default function Footer() {
  const { theme } = useTheme();
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="relative bg-footer-bg text-footer-text">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-button-bg/60 to-transparent" />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-button-bg to-button-bg/70 text-button-text shadow-glow-button">
              <GraduationCap size={18} />
            </span>
            <span>{theme.companyName || 'SQR School'}</span>
          </div>
          <p className="text-sm opacity-75">
            Nurturing curious minds and building strong foundations for tomorrow&apos;s leaders.
          </p>

          <div className="mt-4 flex items-center gap-2">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 shadow-premium-sm ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:bg-button-bg hover:text-button-text hover:shadow-glow-button"
              >
                <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold opacity-90">Quick Links</h4>
          <ul className="space-y-1.5 text-sm opacity-75">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="inline-block transition-all hover:translate-x-0.5 hover:opacity-100">
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/login" className="inline-block transition-all hover:translate-x-0.5 hover:opacity-100">
                Login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold opacity-90">Programs</h4>
          <ul className="space-y-1.5 text-sm opacity-75">
            {PROGRAMS.map((program) => (
              <li key={program}>{program}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold opacity-90">Contact</h4>
          <ul className="space-y-2.5 text-sm opacity-75">
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" /> 123 School Road, Your City
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} className="shrink-0" /> +91 98765 43210
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="shrink-0" /> info@sqrschool.edu
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-center text-xs opacity-60 sm:flex-row sm:px-6 sm:text-left">
          <span>
            © {year} {theme.companyName || 'SQR School'}. All rights reserved.
          </span>
          <a
            href="#home"
            className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 shadow-premium-sm ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:bg-button-bg hover:text-button-text hover:opacity-100 hover:shadow-glow-button"
          >
            Back to top <ArrowUp size={12} />
          </a>
        </div>
      </div>
    </footer>
  );
}

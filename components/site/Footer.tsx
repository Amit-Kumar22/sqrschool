'use client';

import Link from 'next/link';
import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function Footer() {
  const { theme } = useTheme();
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="relative bg-footer-bg text-footer-text">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-button-bg/60 to-transparent" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div>
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <GraduationCap size={20} />
            <span>{theme.companyName || 'SQR School'}</span>
          </div>
          <p className="text-sm opacity-75">
            Nurturing curious minds and building strong foundations for tomorrow&apos;s leaders.
          </p>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold opacity-90">Quick Links</h4>
          <ul className="space-y-1.5 text-sm opacity-75">
            <li><a href="#about" className="transition-opacity hover:opacity-100">About Us</a></li>
            <li><a href="#academics" className="transition-opacity hover:opacity-100">Academics</a></li>
            <li><a href="#admissions" className="transition-opacity hover:opacity-100">Admissions</a></li>
            <li><Link href="/login" className="transition-opacity hover:opacity-100">Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold opacity-90">Programs</h4>
          <ul className="space-y-1.5 text-sm opacity-75">
            <li>Primary School</li>
            <li>Middle School</li>
            <li>Secondary School</li>
            <li>Sports &amp; Activities</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold opacity-90">Contact</h4>
          <ul className="space-y-2 text-sm opacity-75">
            <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /> 123 School Road, Your City</li>
            <li className="flex items-center gap-2"><Phone size={16} className="shrink-0" /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><Mail size={16} className="shrink-0" /> info@sqrschool.edu</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs opacity-60">
        © {year} {theme.companyName || 'SQR School'}. All rights reserved.
      </div>
    </footer>
  );
}

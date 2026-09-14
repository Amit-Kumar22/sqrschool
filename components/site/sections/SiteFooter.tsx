'use client';

import Link from 'next/link';
import { Clock, GraduationCap, Mail, MapPin, Phone } from 'lucide-react';
import type { WebsiteContact, WebsiteSocialLink } from '@/lib/websiteSettingService';
import type { WebsiteNavigationItem, WebsiteSetting } from '@/lib/freeService';
import { socialIconPath } from '@/lib/siteContent';
import SiteImage from '@/components/site/primitives/SiteImage';

interface SiteFooterProps {
  setting: WebsiteSetting | null;
  contact: WebsiteContact | null;
  navItems: WebsiteNavigationItem[];
  socials: WebsiteSocialLink[];
  schoolName: string;
  tagline: string;
  logoUrl: string;
}

export default function SiteFooter({
  setting,
  contact,
  navItems,
  socials,
  schoolName,
  tagline,
  logoUrl,
}: SiteFooterProps) {
  const year = new Date().getFullYear();
  const address = [contact?.addressLine1, contact?.addressLine2, contact?.city, contact?.state, contact?.pincode]
    .filter(Boolean)
    .join(', ');
  const hours = [contact?.workingDays, contact?.workingTime].filter(Boolean).join(' : ');

  return (
    <footer id="contact" className="relative bg-footer-bg text-footer-text">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-button-bg/60 to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-3">
            {logoUrl ? (
              <SiteImage
                src={logoUrl}
                alt={`${schoolName} logo`}
                className="h-12 w-12 shrink-0 rounded-full bg-white object-contain p-0.5"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-button-bg to-button-bg/70 text-button-text shadow-glow-button">
                <GraduationCap size={22} />
              </span>
            )}
            <span>
              <span className="block text-base font-bold uppercase tracking-wide">{schoolName}</span>
              {tagline && <span className="block text-[11px] opacity-70">{tagline}</span>}
            </span>
          </div>

          <p className="max-w-md text-sm leading-relaxed opacity-75">
            {[setting?.board && `Affiliated to ${setting.board}`, setting?.establishedYear && `Established ${setting.establishedYear}`]
              .filter(Boolean)
              .join(' · ') || 'Nurturing curious minds and building strong foundations for tomorrow’s leaders.'}
          </p>

          {socials.length > 0 && (
            <div className="mt-5 flex items-center gap-2">
              {socials.map((social) => {
                const path = socialIconPath(social.platform);
                if (!path) return null;
                return (
                  <a
                    key={social.id}
                    href={social.url || '#'}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.platform}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 shadow-premium-sm ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:bg-button-bg hover:text-button-text hover:shadow-glow-button"
                  >
                    <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                      <path d={path} />
                    </svg>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wide">Quick Links</h4>
          <ul className="space-y-2 text-sm opacity-75">
            {navItems.map((item) => (
              <li key={item.id}>
                <a href={item.url || '#'} className="inline-block transition-all hover:translate-x-0.5 hover:opacity-100">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/login" className="inline-block transition-all hover:translate-x-0.5 hover:opacity-100">
                Portal Login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wide">Contact Us</h4>
          <ul className="space-y-2.5 text-sm opacity-75">
            {address && (
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-button-bg" />
                <span>{address}</span>
              </li>
            )}
            {contact?.phone && (
              <li className="flex items-center gap-2">
                <Phone size={16} className="shrink-0 text-button-bg" />
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="hover:opacity-100">
                  {contact.phone}
                </a>
              </li>
            )}
            {contact?.email && (
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0 text-button-bg" />
                <a href={`mailto:${contact.email}`} className="break-all hover:opacity-100">
                  {contact.email}
                </a>
              </li>
            )}
            {hours && (
              <li className="flex items-center gap-2">
                <Clock size={16} className="shrink-0 text-button-bg" />
                <span>{hours}</span>
              </li>
            )}
            {!address && !contact?.phone && !contact?.email && !hours && (
              <li className="opacity-60">Contact details coming soon.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-center text-xs opacity-60 sm:flex-row sm:px-6 sm:text-left">
          <span>
            © {year} {schoolName}. All rights reserved.
          </span>
          {contact?.country && <span>{contact.country}</span>}
        </div>
      </div>
    </footer>
  );
}

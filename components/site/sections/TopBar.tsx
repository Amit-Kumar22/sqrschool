'use client';

import Link from 'next/link';
import { Clock, Mail, Phone } from 'lucide-react';
import type { WebsiteContact, WebsiteSocialLink } from '@/lib/websiteSettingService';
import { socialIconPath } from '@/lib/siteContent';

interface TopBarProps {
  contact: WebsiteContact | null;
  socials: WebsiteSocialLink[];
  /** `light` sits on a white ground; `dark` carries the brand color to the top of the page. */
  tone?: 'dark' | 'light';
}

/** Utility strip above the header: how to reach the school, portal logins and socials. Desktop only — the phone layout starts at the header. */
export default function TopBar({ contact, socials, tone = 'dark' }: TopBarProps) {
  const hours = [contact?.workingDays, contact?.workingTime].filter(Boolean).join(' : ');
  const details = [
    contact?.phone && { icon: Phone, label: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}` },
    contact?.email && { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
    hours && { icon: Clock, label: hours, href: null },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href: string | null }[];

  if (details.length === 0 && socials.length === 0) return null;

  const light = tone === 'light';

  return (
    <div
      className={`hidden lg:block ${
        light ? 'border-b border-black/5 bg-white text-ink/70' : 'bg-primary text-white/85'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 text-xs sm:px-6">
        <div className="flex items-center gap-5">
          {details.map(({ icon: Icon, label, href }) => (
            <span key={label} className="flex items-center gap-1.5">
              <Icon size={13} className={light ? 'text-primary' : 'text-button-bg'} />
              {href ? (
                <a href={href} className={`transition-colors ${light ? 'hover:text-heading' : 'hover:text-white'}`}>
                  {label}
                </a>
              ) : (
                label
              )}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className={`font-medium transition-colors ${light ? 'hover:text-heading' : 'hover:text-white'}`}
          >
            Student Login
          </Link>
          <span className={`h-3 w-px ${light ? 'bg-black/15' : 'bg-white/25'}`} />
          <Link
            href="/login"
            className={`font-medium transition-colors ${light ? 'hover:text-heading' : 'hover:text-white'}`}
          >
            Parent Login
          </Link>

          {socials.length > 0 && (
            <>
              <span className={`h-3 w-px ${light ? 'bg-black/15' : 'bg-white/25'}`} />
              <div className="flex items-center gap-2.5">
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
                      className={`transition-colors ${light ? 'hover:text-primary' : 'hover:text-button-bg'}`}
                    >
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                        <path d={path} />
                      </svg>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

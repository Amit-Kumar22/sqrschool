'use client';

import Link from 'next/link';
import { Clock, Mail, Phone } from 'lucide-react';
import type { WebsiteContact, WebsiteSocialLink } from '@/lib/websiteSettingService';
import { socialIconPath } from '@/lib/siteContent';

interface TopBarProps {
  contact: WebsiteContact | null;
  socials: WebsiteSocialLink[];
}

/** Utility strip above the header: how to reach the school, portal logins and socials. Desktop only — the phone layout starts at the header. */
export default function TopBar({ contact, socials }: TopBarProps) {
  const hours = [contact?.workingDays, contact?.workingTime].filter(Boolean).join(' : ');
  const details = [
    contact?.phone && { icon: Phone, label: contact.phone, href: `tel:${contact.phone.replace(/\s/g, '')}` },
    contact?.email && { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
    hours && { icon: Clock, label: hours, href: null },
  ].filter(Boolean) as { icon: typeof Phone; label: string; href: string | null }[];

  if (details.length === 0 && socials.length === 0) return null;

  return (
    <div className="hidden bg-primary text-white/85 lg:block">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 text-xs sm:px-6">
        <div className="flex items-center gap-5">
          {details.map(({ icon: Icon, label, href }) => (
            <span key={label} className="flex items-center gap-1.5">
              <Icon size={13} className="text-button-bg" />
              {href ? (
                <a href={href} className="transition-colors hover:text-white">
                  {label}
                </a>
              ) : (
                label
              )}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="font-medium transition-colors hover:text-white">
            Student Login
          </Link>
          <span className="h-3 w-px bg-white/25" />
          <Link href="/login" className="font-medium transition-colors hover:text-white">
            Parent Login
          </Link>

          {socials.length > 0 && (
            <>
              <span className="h-3 w-px bg-white/25" />
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
                      className="transition-colors hover:text-button-bg"
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

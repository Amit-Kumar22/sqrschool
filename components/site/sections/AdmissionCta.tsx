'use client';

import { ArrowRight } from 'lucide-react';
import type { SectionCopy } from '@/lib/siteContent';
import SiteImage from '@/components/site/primitives/SiteImage';

interface AdmissionCtaProps {
  copy: SectionCopy;
  ctaLabel: string;
  ctaUrl: string;
  /** Photo set into the left of the band — the showcase layout only. */
  image?: string | null;
  /** Optional outlined second action beside the primary one. */
  secondary?: { label: string; url: string };
}

/** Closing admissions band — the CMS's ADMISSION_CTA section. */
export default function AdmissionCta({ copy, ctaLabel, ctaUrl, image, secondary }: AdmissionCtaProps) {
  return (
    <section id="admissions" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      {/* Filled with primary rather than a primary→secondary gradient: a theme's
          secondary is often a light accent (this one's is gold), and white text
          over that end of the ramp fails contrast. */}
      <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl bg-primary text-center text-white shadow-glow-primary-lg lg:flex-row lg:text-left">
        <div className="pointer-events-none absolute -top-20 -right-16 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

        {image && (
          <SiteImage
            src={image}
            alt={copy.title}
            className="hidden h-44 w-72 shrink-0 object-cover lg:block"
          />
        )}

        <div className="relative flex flex-1 flex-col items-center gap-5 px-7 py-10 sm:flex-row sm:text-left lg:pl-0">
          <div className="flex-1">
            {copy.eyebrow && (
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-button-bg">{copy.eyebrow}</p>
            )}
            <h2 className="mt-1.5 text-xl font-bold sm:text-2xl">{copy.title}</h2>
            {copy.description && <p className="mt-2 max-w-2xl text-sm text-white/80">{copy.description}</p>}
          </div>

          <div className="flex shrink-0 flex-wrap justify-center gap-3">
            <a
              href={ctaUrl}
              className="inline-flex items-center gap-2 rounded-md bg-button-bg px-6 py-3 text-sm font-bold uppercase tracking-wide text-button-text shadow-glow-button transition-all hover:-translate-y-0.5 hover:shadow-glow-button-lg"
            >
              {ctaLabel} <ArrowRight size={16} />
            </a>
            {secondary && (
              <a
                href={secondary.url}
                className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
              >
                {secondary.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

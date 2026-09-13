'use client';

import { ArrowRight, Play } from 'lucide-react';
import type { WebsiteFeature } from '@/lib/websiteSettingService';
import { resolveIcon, type SectionCopy, type SiteVariant } from '@/lib/siteContent';
import SectionHeading from './SectionHeading';
import SiteImage from './SiteImage';

interface AboutSectionProps {
  copy: SectionCopy;
  /** Icon-led highlights beside the about copy — the features the pillar strip didn't take. */
  highlights: WebsiteFeature[];
  media: { src: string; alt: string; videoUrl?: string } | null;
  variant: SiteVariant;
  ctaLabel: string;
  ctaUrl: string;
}

/** About block: section copy plus highlights beside the campus photo. `classic` sets the copy in a filled panel, `split` on the page ground. */
export default function AboutSection({ copy, highlights, media, variant, ctaLabel, ctaUrl }: AboutSectionProps) {
  const onDark = variant === 'classic';

  return (
    <section id="about" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div
          className={
            onDark
              ? 'rounded-2xl bg-primary p-7 text-white shadow-glow-primary sm:p-9'
              : 'lg:pr-6'
          }
        >
          <SectionHeading
            align="left"
            tone={onDark ? 'onDark' : 'default'}
            eyebrow={copy.eyebrow}
            title={copy.title}
            description={copy.description}
          />

          {highlights.length > 0 && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {highlights.map((highlight) => {
                const Icon = resolveIcon(highlight.icon);
                return (
                  <div key={highlight.id} className="flex gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        onDark ? 'bg-white/10 text-button-bg' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${onDark ? 'text-white' : 'text-heading'}`}>
                        {highlight.title}
                      </p>
                      {highlight.description && (
                        <p className={`mt-0.5 text-xs leading-relaxed ${onDark ? 'text-white/70' : 'text-ink/60'}`}>
                          {highlight.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <a
            href={ctaUrl}
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-button-bg px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-button-text shadow-glow-button transition-all hover:-translate-y-0.5 hover:shadow-glow-button-lg"
          >
            {ctaLabel} <ArrowRight size={15} />
          </a>
        </div>

        {media && (
          <div className="relative overflow-hidden rounded-2xl shadow-glow-primary">
            <SiteImage src={media.src} alt={media.alt} className="h-64 w-full object-cover sm:h-80 lg:h-[24rem]" />
            {media.videoUrl && (
              <a
                href={media.videoUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Play ${media.alt}`}
                className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/25 text-white ring-2 ring-white/70 backdrop-blur-sm transition-transform duration-300 hover:scale-105">
                  <Play size={24} className="ml-1" fill="currentColor" />
                </span>
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

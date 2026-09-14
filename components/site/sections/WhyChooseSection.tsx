'use client';

import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { WebsiteWhyChoosePoint } from '@/lib/websiteSettingService';
import type { SectionCopy } from '@/lib/siteContent';
import SectionHeading from '@/components/site/primitives/SectionHeading';
import SiteImage from '@/components/site/primitives/SiteImage';

interface WhyChooseSectionProps {
  points: WebsiteWhyChoosePoint[];
  copy: SectionCopy;
  image: string | null;
  ctaLabel: string;
  ctaUrl: string;
  /** `dark` fills the panel with the primary color; `light` keeps it a white card. */
  tone: 'dark' | 'light';
}

/** "Why choose us" panel — the CMS's selling points as a checklist beside a campus photo. */
export default function WhyChooseSection({ points, copy, image, ctaLabel, ctaUrl, tone }: WhyChooseSectionProps) {
  if (points.length === 0) return null;

  const onDark = tone === 'dark';

  return (
    <section
      className={`relative h-full min-w-0 overflow-hidden rounded-2xl ${
        onDark ? 'bg-primary text-white shadow-glow-primary' : 'border border-black/5 bg-white shadow-premium'
      }`}
    >
      <div className="grid sm:grid-cols-5">
        <div className="p-7 sm:col-span-3">
          <SectionHeading align="left" tone={onDark ? 'onDark' : 'default'} eyebrow={copy.eyebrow} title={copy.title} />

          <ul className="mt-5 space-y-2.5">
            {points.map((point) => (
              <li key={point.id} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 size={17} className={`mt-0.5 shrink-0 ${onDark ? 'text-button-bg' : 'text-primary'}`} />
                <span className={onDark ? 'text-white/85' : 'text-ink/75'}>{point.point}</span>
              </li>
            ))}
          </ul>

          <a
            href={ctaUrl}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-button-bg px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-button-text shadow-glow-button transition-all hover:-translate-y-0.5 hover:shadow-glow-button-lg"
          >
            {ctaLabel} <ArrowRight size={14} />
          </a>
        </div>

        {image && (
          <div className="relative hidden min-h-[16rem] sm:col-span-2 sm:block">
            <SiteImage src={image} alt={copy.title} className="absolute inset-0 h-full w-full object-cover" />
            <span
              className={`absolute inset-0 ${
                onDark ? 'bg-gradient-to-r from-primary via-primary/40 to-transparent' : 'bg-gradient-to-r from-white via-white/30 to-transparent'
              }`}
            />
          </div>
        )}
      </div>
    </section>
  );
}

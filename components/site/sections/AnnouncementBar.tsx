'use client';

import { Megaphone } from 'lucide-react';
import type { Holiday } from '@/lib/holidayService';
import type { SectionCopy } from '@/lib/siteContent';

interface AnnouncementBarProps {
  copy: SectionCopy;
  /** Upcoming holiday from the CMS, appended to the ticker when it's active. */
  holiday: Holiday | null;
  ctaLabel: string;
  ctaUrl: string;
  /** `bar` runs edge to edge under the hero; `card` insets it into the page grid. */
  layout?: 'bar' | 'card';
}

const formatHolidayDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Ticker under the hero carrying the announcement section's copy and any active holiday — a full-bleed strip, or an inset card in the showcase layout. */
export default function AnnouncementBar({ copy, holiday, ctaLabel, ctaUrl, layout = 'bar' }: AnnouncementBarProps) {
  const holidayDate = holiday?.holidayDate ? formatHolidayDate(holiday.holidayDate) : '';
  const messages = [
    copy.description || copy.title,
    holiday?.active && holiday.holidayName
      ? [holiday.holidayName, holidayDate].filter(Boolean).join(' · ')
      : null,
  ].filter(Boolean) as string[];

  if (messages.length === 0) return null;

  const text = messages.join('   •   ');
  const inset = layout === 'card';

  const row = (
    <div
      className={`mx-auto flex max-w-7xl items-center gap-4 ${
        inset ? 'rounded-xl bg-primary px-5 py-3 shadow-glow-primary' : 'px-4 py-2.5 sm:px-6'
      }`}
    >
        <span className="flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-button-bg sm:text-xs">
          <Megaphone size={16} className="shrink-0" />
          <span className="hidden sm:inline">{copy.eyebrow}</span>
        </span>
        <span className="hidden h-5 w-px shrink-0 bg-white/20 sm:block" />

        {/* min-w-0 is load-bearing: a flex child defaults to min-width:auto, so
            without it the w-max ticker widens the whole row instead of being
            clipped, and the page scrolls sideways on phones. */}
        <div className="relative min-w-0 flex-1 overflow-hidden">
          {/* Two copies, each carrying its own trailing gap, so the -50% loop lands seamlessly. */}
          <div className="animate-marquee flex w-max items-center motion-reduce:animate-none">
            <span className="pr-16 text-sm whitespace-nowrap">{text}</span>
            <span className="pr-16 text-sm whitespace-nowrap" aria-hidden="true">
              {text}
            </span>
          </div>
        </div>

        <a
          href={ctaUrl}
          className="hidden shrink-0 rounded bg-button-bg px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-button-text shadow-glow-button transition-all hover:-translate-y-0.5 hover:shadow-glow-button-lg sm:inline-block"
        >
          {ctaLabel}
        </a>
    </div>
  );

  if (inset) {
    return (
      <section id="announcements" className="px-4 pt-6 text-white sm:px-6">
        {row}
      </section>
    );
  }

  return (
    <section id="announcements" className="border-y border-white/10 bg-primary text-white">
      {row}
    </section>
  );
}

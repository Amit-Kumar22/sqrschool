'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WebsiteTopper } from '@/lib/websiteSettingService';
import { initials, type SectionCopy } from '@/lib/siteContent';
import SectionHeading from '@/components/site/primitives/SectionHeading';
import SiteImage from '@/components/site/primitives/SiteImage';
import { useCarousel } from '@/components/site/primitives/useCarousel';

// Medal colors are conventional rather than themed — a silver 2nd place reads
// wrong in any brand palette. Ranks past the podium fall back to the theme.
const RANK_STYLES: Record<number, string> = {
  1: 'bg-button-bg text-button-text',
  2: 'bg-slate-300 text-slate-800',
  3: 'bg-amber-700 text-white',
};

/** Toppers row — ranked result cards in a swipeable, arrow-paged track. */
export default function ToppersSection({ toppers, copy }: { toppers: WebsiteTopper[]; copy: SectionCopy }) {
  const { trackRef, onScroll, scrollByPage, atStart, atEnd } = useCarousel();

  if (toppers.length === 0) return null;

  return (
    <section id="toppers" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />

      <div className="relative mt-9">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="scrollbar-thin flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
        >
          {toppers.map((topper, idx) => (
            <article
              key={topper.id}
              style={{ animationDelay: `${idx * 70}ms` }}
              className="animate-fade-in-up relative w-[72%] shrink-0 snap-start rounded-xl border border-black/5 bg-white px-5 pt-8 pb-6 text-center shadow-premium transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-primary sm:w-[46%] lg:w-[calc(25%-0.94rem)] xl:w-[calc(20%-1rem)]"
            >
              <span
                className={`absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-premium-sm ${
                  RANK_STYLES[topper.rank] ?? 'bg-primary text-white'
                }`}
              >
                {topper.rank}
              </span>

              {topper.photoUrl ? (
                <SiteImage
                  src={topper.photoUrl}
                  alt={topper.name}
                  className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-primary/10"
                />
              ) : (
                <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-4 ring-primary/10">
                  {initials(topper.name) || '—'}
                </span>
              )}

              <h3 className="mt-4 truncate text-sm font-bold text-heading">{topper.name}</h3>
              {topper.stream && <p className="mt-0.5 truncate text-xs text-ink/55">{topper.stream}</p>}
              <p className="mt-2 text-2xl font-bold text-primary">{topper.percentage}%</p>
              {topper.session && (
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink/45">{topper.session}</p>
              )}
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          disabled={atStart}
          aria-label="Previous toppers"
          className="absolute top-1/2 -left-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-premium transition-all hover:-translate-x-0.5 hover:shadow-glow-primary disabled:pointer-events-none disabled:opacity-35 sm:flex"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          disabled={atEnd}
          aria-label="Next toppers"
          className="absolute top-1/2 -right-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-premium transition-all hover:translate-x-0.5 hover:shadow-glow-primary disabled:pointer-events-none disabled:opacity-35 sm:flex"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

'use client';

import { Quote, Star } from 'lucide-react';
import type { WebsiteTestimonial } from '@/lib/freeService';
import { initials, type SectionCopy } from '@/lib/siteContent';
import SectionHeading from './SectionHeading';
import SiteImage from './SiteImage';
import { useCarousel } from './useCarousel';

interface TestimonialsSectionProps {
  testimonials: WebsiteTestimonial[];
  copy: SectionCopy;
  /** `wide` shows three cards per view across the page; `panel` is a single-card column. */
  layout: 'wide' | 'panel';
}

/** Parent testimonials — a swipeable, dot-paged row of quote cards. */
export default function TestimonialsSection({ testimonials, copy, layout }: TestimonialsSectionProps) {
  const { trackRef, onScroll, goToPage, page, pageCount } = useCarousel();

  if (testimonials.length === 0) return null;

  const wide = layout === 'wide';

  const cards = (
    <div
      ref={trackRef}
      onScroll={onScroll}
      className="scrollbar-thin flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
    >
      {testimonials.map((testimonial) => (
        <figure
          key={testimonial.id}
          className={`flex shrink-0 snap-start flex-col rounded-xl border border-black/5 bg-white p-6 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-primary ${
            wide ? 'w-[85%] sm:w-[48%] lg:w-[calc(33.333%-0.84rem)]' : 'w-full lg:w-[calc(50%-0.63rem)]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <Quote size={22} className="shrink-0 text-primary/25" />
            {testimonial.rating > 0 && (
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(Math.round(testimonial.rating), 5) }).map((_, idx) => (
                  <Star key={idx} size={13} className="text-button-bg" fill="currentColor" />
                ))}
              </div>
            )}
          </div>

          <blockquote className="mt-3 text-sm leading-relaxed text-ink/75">{testimonial.quote}</blockquote>

          <figcaption className="mt-5 flex items-center gap-3 border-t border-black/5 pt-4">
            {testimonial.photoUrl ? (
              <SiteImage
                src={testimonial.photoUrl}
                alt={testimonial.parentName}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-primary/10"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {initials(testimonial.parentName) || '—'}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-heading">{testimonial.parentName}</p>
              {testimonial.relation && <p className="truncate text-xs text-ink/55">{testimonial.relation}</p>}
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );

  const dots = pageCount > 1 && (
    <div className="mt-5 flex items-center justify-center gap-1.5">
      {Array.from({ length: pageCount }).map((_, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => goToPage(idx)}
          aria-label={`Go to testimonial page ${idx + 1}`}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            page === idx ? 'w-6 bg-primary' : 'w-1.5 bg-primary/25 hover:bg-primary/50'
          }`}
        />
      ))}
    </div>
  );

  if (!wide) {
    return (
      <section className="flex h-full min-w-0 flex-col rounded-2xl border border-black/5 bg-white/60 p-6 shadow-premium">
        <SectionHeading align="left" eyebrow={copy.eyebrow} title={copy.title} />
        <div className="mt-5">{cards}</div>
        {dots}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
      <div className="mt-9">{cards}</div>
      {dots}
    </section>
  );
}

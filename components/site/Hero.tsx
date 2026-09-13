'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, ChevronLeft, ChevronRight, Download, Phone, Play } from 'lucide-react';
import type { WebsiteHeroButton, WebsiteHeroSlide } from '@/lib/websiteSettingService';
import type { SiteVariant } from '@/lib/siteContent';
import SiteImage from './SiteImage';

interface HeroProps {
  slides: WebsiteHeroSlide[];
  /** Every hero button from the CMS; each is matched to its slide by heroSlideId. */
  buttons: WebsiteHeroButton[];
  variant: SiteVariant;
  schoolName: string;
  tagline: string;
  yearsOfExcellence: number | null;
}

const SLIDE_INTERVAL_MS = 7000;

// Hero buttons carry a free-text icon keyword; these are the ones that make
// sense on a hero CTA (a "play" here is a tour video, not a playground — which
// is why this is a local map rather than the shared resolveIcon keywords).
function buttonIcon(keyword?: string | null): LucideIcon {
  const key = (keyword ?? '').toLowerCase();
  if (key.includes('play') || key.includes('video') || key.includes('tour')) return Play;
  if (key.includes('call') || key.includes('phone')) return Phone;
  if (key.includes('download') || key.includes('brochure')) return Download;
  return ArrowRight;
}

/**
 * Hero slider. `classic` fills the viewport with the slide photo and lays the
 * copy over it; `split` sets the copy beside a framed photo on a light ground.
 * Both fall back to a single slide built from the school's own name so the page
 * never opens on an empty banner.
 */
export default function Hero({ slides, buttons, variant, schoolName, tagline, yearsOfExcellence }: HeroProps) {
  const resolvedSlides = useMemo<WebsiteHeroSlide[]>(
    () =>
      slides.length > 0
        ? slides
        : [
            {
              id: 0,
              backgroundImageUrl: '/images/building.jpg',
              badge: 'Welcome to',
              title: schoolName,
              subtitle: tagline,
              description: '',
              displayOrder: 1,
              active: true,
            },
          ],
    [slides, schoolName, tagline],
  );

  const [index, setIndex] = useState(0);
  const count = resolvedSlides.length;

  // Clamp when the CMS returns fewer slides than the index we're sitting on.
  const active = resolvedSlides[Math.min(index, count - 1)];
  const activeButtons = buttons.filter((button) => button.heroSlideId === active.id);

  const goTo = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count]);

  const dots =
    count > 1 ? (
      <div className="flex items-center justify-center gap-1.5">
        {resolvedSlides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => goTo(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === index ? 'w-7 bg-button-bg' : 'w-1.5 bg-current opacity-40 hover:opacity-70'
            }`}
          />
        ))}
      </div>
    ) : null;

  const renderButtons = (tone: 'onDark' | 'onLight') =>
    activeButtons.length > 0 && (
      <div className="mt-7 flex flex-wrap gap-3">
        {activeButtons.map((button) => {
          const Icon = buttonIcon(button.icon);
          const isPrimary = (button.style ?? '').toUpperCase() !== 'SECONDARY';
          return (
            <a
              key={button.id}
              href={button.url || '#'}
              className={
                isPrimary
                  ? 'inline-flex items-center gap-2 rounded-md bg-button-bg px-6 py-3 text-sm font-bold uppercase tracking-wide text-button-text shadow-glow-button transition-all hover:-translate-y-0.5 hover:shadow-glow-button-lg'
                  : tone === 'onDark'
                    ? 'inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20'
                    : 'inline-flex items-center gap-2 rounded-md border border-primary/25 bg-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-heading shadow-premium-sm transition-all hover:-translate-y-0.5 hover:shadow-premium'
              }
            >
              {button.label} <Icon size={15} />
            </a>
          );
        })}
      </div>
    );

  const yearsBadge = yearsOfExcellence && (
    <div className="flex flex-col items-center rounded-xl bg-primary px-6 py-4 text-center text-white shadow-glow-primary ring-1 ring-button-bg/50">
      <span className="text-3xl font-bold leading-none text-button-bg">{yearsOfExcellence}+</span>
      <span className="mt-1 text-[11px] font-semibold uppercase leading-tight tracking-wide">
        Years of
        <br />
        Excellence
      </span>
    </div>
  );

  if (variant === 'split') {
    return (
      <section id="home" className="relative overflow-hidden bg-surface">
        <div className="pointer-events-none absolute -top-24 -left-28 h-72 w-72 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute top-1/3 -right-16 h-64 w-64 rounded-full bg-button-bg/10 blur-2xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
          <div key={active.id} className="animate-fade-in-up">
            {active.badge && (
              <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-primary">
                {active.badge}
                <span className="h-px w-10 bg-primary/40" />
              </p>
            )}
            <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-heading sm:text-5xl lg:text-6xl">
              {active.title}
            </h1>
            {active.subtitle && (
              <p className="mt-3 text-xl font-semibold text-button-bg sm:text-2xl">{active.subtitle}</p>
            )}
            {active.description && (
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink/70 sm:text-base">{active.description}</p>
            )}
            {renderButtons('onLight')}
            {dots && <div className="mt-8 flex text-ink">{dots}</div>}
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[1.75rem] shadow-glow-primary">
              <SiteImage
                key={active.id}
                src={active.backgroundImageUrl}
                alt={active.title || schoolName}
                className="animate-fade-in h-64 w-full object-cover sm:h-80 lg:h-[26rem]"
              />
            </div>
            {yearsBadge && <div className="absolute -bottom-5 left-5 sm:left-8">{yearsBadge}</div>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="home" className="relative overflow-hidden bg-primary text-white">
      <div className="relative h-[30rem] sm:h-[34rem] lg:h-[38rem]">
        {resolvedSlides.map((slide, idx) => (
          <SiteImage
            key={slide.id}
            src={slide.backgroundImageUrl}
            alt={slide.title || schoolName}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              idx === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />

        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6">
          <div key={active.id} className="animate-fade-in-up max-w-2xl [text-shadow:0_2px_14px_rgb(0_0_0_/_45%)]">
            {active.badge && (
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-button-bg">{active.badge}</p>
            )}
            <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              {active.title}
            </h1>
            {active.subtitle && (
              <p className="mt-3 text-xl font-semibold text-button-bg sm:text-2xl">{active.subtitle}</p>
            )}
            {active.description && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">{active.description}</p>
            )}
            {renderButtons('onDark')}
          </div>

          {yearsBadge && <div className="absolute right-6 bottom-24 hidden lg:block">{yearsBadge}</div>}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous slide"
              className="absolute top-1/2 left-3 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-sm transition-all hover:bg-white/20 sm:flex"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next slide"
              className="absolute top-1/2 right-3 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/25 backdrop-blur-sm transition-all hover:bg-white/20 sm:flex"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute inset-x-0 bottom-6 flex justify-center text-white">{dots}</div>
          </>
        )}
      </div>
    </section>
  );
}

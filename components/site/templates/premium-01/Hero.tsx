'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import HeroDots from '@/components/site/primitives/HeroDots';
import SiteImage from '@/components/site/primitives/SiteImage';
import YearsBadge from '@/components/site/primitives/YearsBadge';
import { heroButtonIcon, isPrimaryHeroButton, useHeroSlides } from '@/components/site/primitives/useHeroSlides';
import type { SiteContentView } from '@/components/site/useSiteContent';

/** Premium 01 hero — the slide photo fills the band and the copy sits over a dark scrim. */
export default function ClassicHero({ site }: { site: SiteContentView }) {
  const { slides, active, activeButtons, index, count, goTo } = useHeroSlides({
    slides: site.heroSlides,
    buttons: site.heroButtons,
    schoolName: site.schoolName,
    tagline: site.tagline,
  });

  return (
    <section id="home" className="relative overflow-hidden bg-primary text-white">
      <div className="relative h-[30rem] sm:h-[34rem] lg:h-[38rem]">
        {slides.map((slide, idx) => (
          <SiteImage
            key={slide.id}
            src={slide.backgroundImageUrl}
            alt={slide.title || site.schoolName}
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

            {activeButtons.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-3">
                {activeButtons.map((button) => {
                  const Icon = heroButtonIcon(button.icon);
                  return (
                    <a
                      key={button.id}
                      href={button.url || '#'}
                      className={
                        isPrimaryHeroButton(button)
                          ? 'inline-flex items-center gap-2 rounded-md bg-button-bg px-6 py-3 text-sm font-bold uppercase tracking-wide text-button-text shadow-glow-button transition-all hover:-translate-y-0.5 hover:shadow-glow-button-lg'
                          : 'inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20'
                      }
                    >
                      {button.label} <Icon size={15} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="absolute right-6 bottom-24 hidden lg:block">
            <YearsBadge years={site.yearsOfExcellence} />
          </div>
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
            <HeroDots
              count={count}
              index={index}
              onSelect={goTo}
              className="absolute inset-x-0 bottom-6 justify-center text-white"
            />
          </>
        )}
      </div>
    </section>
  );
}

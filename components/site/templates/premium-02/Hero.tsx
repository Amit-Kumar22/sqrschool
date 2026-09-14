'use client';

import HeroDots from '@/components/site/primitives/HeroDots';
import SiteImage from '@/components/site/primitives/SiteImage';
import YearsBadge from '@/components/site/primitives/YearsBadge';
import { heroButtonIcon, isPrimaryHeroButton, useHeroSlides } from '@/components/site/primitives/useHeroSlides';
import type { SiteContentView } from '@/components/site/useSiteContent';

/** Premium 02 hero — copy beside a framed photo on the page's own light ground. */
export default function SplitHero({ site }: { site: SiteContentView }) {
  const { active, activeButtons, index, count, goTo } = useHeroSlides({
    slides: site.heroSlides,
    buttons: site.heroButtons,
    schoolName: site.schoolName,
    tagline: site.tagline,
  });

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
                        : 'inline-flex items-center gap-2 rounded-md border border-primary/25 bg-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-heading shadow-premium-sm transition-all hover:-translate-y-0.5 hover:shadow-premium'
                    }
                  >
                    {button.label} <Icon size={15} />
                  </a>
                );
              })}
            </div>
          )}

          <HeroDots count={count} index={index} onSelect={goTo} className="mt-8 text-ink" />
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[1.75rem] shadow-glow-primary">
            <SiteImage
              key={active.id}
              src={active.backgroundImageUrl}
              alt={active.title || site.schoolName}
              className="animate-fade-in h-64 w-full object-cover sm:h-80 lg:h-[26rem]"
            />
          </div>
          <div className="absolute -bottom-5 left-5 sm:left-8">
            <YearsBadge years={site.yearsOfExcellence} />
          </div>
        </div>
      </div>
    </section>
  );
}

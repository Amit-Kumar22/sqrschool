'use client';

import HeroDots from '@/components/site/primitives/HeroDots';
import SiteImage from '@/components/site/primitives/SiteImage';
import YearsBadge from '@/components/site/primitives/YearsBadge';
import { heroButtonIcon, isPrimaryHeroButton, useHeroSlides } from '@/components/site/primitives/useHeroSlides';
import type { SiteContentView } from '@/components/site/useSiteContent';

/** Premium 03 hero — two-line wordmark beside a shaped photo, with pill actions. */
export default function ShowcaseHero({ site }: { site: SiteContentView }) {
  const { active, activeButtons, index, count, goTo } = useHeroSlides({
    slides: site.heroSlides,
    buttons: site.heroButtons,
    schoolName: site.schoolName,
    tagline: site.tagline,
  });

  // The title is set as a two-line wordmark: the name in the heading color above
  // the rest in the brand color. The lead is the first word, unless that word is
  // a short honorific ("St. Xavier's International School"), where it takes two
  // so the first line isn't a stub.
  const words = (active.title ?? '').split(' ').filter(Boolean);
  const leadCount = words[0] && words[0].length <= 3 && words.length > 2 ? 2 : 1;
  const lead = words.slice(0, leadCount).join(' ');
  const rest = words.slice(leadCount).join(' ');

  return (
    <section id="home" className="relative overflow-hidden bg-surface">
      <div className="pointer-events-none absolute top-1/4 -left-32 h-80 w-80 rounded-full bg-primary/[0.06]" />

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-14">
        <div key={active.id} className="animate-fade-in-up relative">
          {active.badge && (
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">{active.badge}</p>
          )}
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="block text-heading">{lead}</span>
            {rest && <span className="block text-primary">{rest}</span>}
          </h1>
          {active.subtitle && (
            <>
              <p className="mt-4 text-lg font-semibold text-heading sm:text-xl">{active.subtitle}</p>
              <span className="mt-2 block h-1 w-24 rounded-full bg-button-bg" />
            </>
          )}
          {active.description && (
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink/70 sm:text-base">{active.description}</p>
          )}

          {activeButtons.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {activeButtons.map((button) => {
                const Icon = heroButtonIcon(button.icon);
                const primary = isPrimaryHeroButton(button);
                return (
                  <a
                    key={button.id}
                    href={button.url || '#'}
                    className={`group inline-flex items-center gap-3 rounded-full py-2 pr-2 pl-6 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                      primary
                        ? 'bg-primary text-white shadow-glow-primary hover:shadow-glow-primary-lg'
                        : 'border border-primary/20 bg-white text-heading shadow-premium-sm hover:shadow-premium'
                    }`}
                  >
                    {button.label}
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5 ${
                        primary ? 'bg-white/20 text-white' : 'bg-primary text-white'
                      }`}
                    >
                      <Icon size={14} />
                    </span>
                  </a>
                );
              })}
            </div>
          )}

          <HeroDots count={count} index={index} onSelect={goTo} className="mt-8 text-ink" />
        </div>

        <div className="relative">
          {/* Arc echoing the photo's shaped corners. */}
          <div className="pointer-events-none absolute -top-3 -right-3 bottom-8 left-10 rounded-tl-[7rem] rounded-br-[7rem] bg-primary/10" />
          <SiteImage
            key={active.id}
            src={active.backgroundImageUrl}
            alt={active.title || site.schoolName}
            className="animate-fade-in relative h-64 w-full rounded-tl-[7rem] rounded-tr-2xl rounded-br-[7rem] rounded-bl-2xl object-cover shadow-glow-primary sm:h-80 lg:h-[26rem]"
          />
          <div className="absolute bottom-6 -left-2 sm:left-4">
            <YearsBadge years={site.yearsOfExcellence} />
          </div>
        </div>
      </div>
    </section>
  );
}

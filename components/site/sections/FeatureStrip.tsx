'use client';

import type { WebsiteFeature } from '@/lib/websiteSettingService';
import { resolveIcon } from '@/lib/siteContent';

/** The pillar row directly under the hero — one icon-led column per CMS feature. */
export default function FeatureStrip({ features }: { features: WebsiteFeature[] }) {
  if (features.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid divide-y divide-black/5 overflow-hidden rounded-xl border border-black/5 bg-white shadow-premium sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 xl:grid-cols-5">
        {features.map((feature, idx) => {
          const Icon = resolveIcon(feature.icon);
          return (
            <div
              key={feature.id}
              style={{ animationDelay: `${idx * 70}ms` }}
              // min-w-0: grid tracks are auto-min by default, so a long title
              // would widen its column past the card instead of wrapping.
              className="animate-fade-in-up group flex min-w-0 flex-col items-center gap-2.5 px-5 py-7 text-center transition-colors hover:bg-primary/[0.03]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-primary group-hover:text-white group-hover:shadow-glow-primary">
                <Icon size={22} />
              </span>
              <p className="text-sm font-bold text-heading">{feature.title}</p>
              {feature.description && (
                <p className="text-xs leading-relaxed text-ink/60">{feature.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

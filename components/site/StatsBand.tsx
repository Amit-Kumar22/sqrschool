'use client';

import type { WebsiteStatistic } from '@/lib/websiteSettingService';
import { resolveIcon, type SiteVariant } from '@/lib/siteContent';

/** Counter band. `split` frames it as a card inside the page grid; `classic` runs it edge to edge. */
export default function StatsBand({ stats, variant }: { stats: WebsiteStatistic[]; variant: SiteVariant }) {
  if (stats.length === 0) return null;

  const rows = (
    <div className="grid divide-y divide-white/15 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
      {stats.map((stat) => {
        const Icon = resolveIcon(stat.icon);
        return (
          <div key={stat.id} className="flex items-center justify-center gap-3 px-6 py-6">
            <Icon size={30} className="shrink-0 text-button-bg" />
            <div>
              <p className="text-2xl font-bold leading-none">{stat.number}</p>
              <p className="mt-1 text-xs font-medium tracking-wide opacity-80">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (variant === 'split') {
    return (
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl bg-primary text-white shadow-glow-primary">
          {rows}
        </div>
      </section>
    );
  }

  return (
    // Filled with primary, not a primary→secondary gradient: a theme's secondary
    // is often a light accent, and white counters read poorly over it.
    <section className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">{rows}</div>
    </section>
  );
}

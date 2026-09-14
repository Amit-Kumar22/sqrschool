'use client';

import dynamic from 'next/dynamic';
import type { SiteTemplate, TemplateManifestEntry } from './types';

// ─── Home page template registry ─────────────────────────────────────────────
// The colour theme's `themeType` selects which template renders the public home
// page. Every template is imported lazily, so a visitor downloads the one that
// is active rather than all of them — the whole reason this is a registry and
// not a switch statement.
//
// To add a template: create components/site/templates/<key>/index.tsx, then add
// one row to TEMPLATES and one to TEMPLATE_MANIFEST. Nothing else changes — the
// data layer (useSiteContent) and every shared section already work for it.

const loading = () => null;

export const TEMPLATES: Record<string, SiteTemplate> = {
  'PREMIUM': dynamic(() => import('./premium-01'), { loading }),
  'PREMIUM-2': dynamic(() => import('./premium-02'), { loading }),
  'PREMIUM-3': dynamic(() => import('./premium-03'), { loading }),
};

/** Rendered when a theme's `themeType` names no registered template. */
export const FALLBACK_TEMPLATE_KEY = 'PREMIUM';

/** Powers the Super Admin theme form's template picker — keep in step with TEMPLATES. */
export const TEMPLATE_MANIFEST: TemplateManifestEntry[] = [
  {
    key: 'PREMIUM',
    name: 'Premium 01 · Classic',
    description: 'Full-bleed photographic hero, full-width gallery, why-choose beside testimonials.',
  },
  {
    key: 'PREMIUM-2',
    name: 'Premium 02 · Split',
    description: 'Light split hero, statistics card, gallery paired with why-choose.',
  },
  {
    key: 'PREMIUM-3',
    name: 'Premium 03 · Showcase',
    description: 'Light utility bar, centred nav, shaped hero, full-width closing sections.',
  },
];

/**
 * Resolves a theme type to a registered template key.
 *
 * Deliberately an exact match rather than parsing a number out of the value:
 * with dozens of registered templates, a typo has to fall back visibly to the
 * default rather than silently render some unrelated layout.
 *
 * Returns the key (not the component) so callers look the component up from
 * TEMPLATES — the entries there are created once at module load, which keeps
 * the component identity stable across renders.
 */
export function resolveTemplateKey(themeType?: string | null): string {
  const key = (themeType ?? '').trim().toUpperCase();
  return key in TEMPLATES ? key : FALLBACK_TEMPLATE_KEY;
}

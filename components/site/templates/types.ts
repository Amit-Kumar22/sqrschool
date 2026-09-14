import type { ComponentType } from 'react';
import type { SiteContentView } from '@/components/site/useSiteContent';

/**
 * The contract every home-page template satisfies. A template is pure
 * composition: it receives the already-normalized CMS view and renders markup.
 * It must not fetch, and must not re-derive what `useSiteContent` already
 * decided (enabled sections, ordering, fallback copy) — that keeps 40 templates
 * from drifting into 40 subtly different interpretations of the same CMS.
 */
export interface SiteTemplateProps {
  site: SiteContentView;
}

export type SiteTemplate = ComponentType<SiteTemplateProps>;

/** What the Super Admin theme picker shows for each registered template. */
export interface TemplateManifestEntry {
  /** The colour theme's `themeType` value that selects this template. */
  key: string;
  name: string;
  description: string;
}

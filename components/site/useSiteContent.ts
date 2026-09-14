'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  EMPTY_WEBSITE_CONTENT,
  getWebsiteContent,
  type WebsiteContent,
  type WebsiteNavigationItem,
  type WebsiteTestimonial,
} from '@/lib/freeService';
import type {
  WebsiteFeature,
  WebsiteGalleryItem,
  WebsiteHeroButton,
  WebsiteHeroSlide,
  WebsiteSocialLink,
  WebsiteStatistic,
  WebsiteTopper,
  WebsiteWhyChoosePoint,
} from '@/lib/websiteSettingService';
import {
  activeSorted,
  buildSectionMap,
  DEFAULT_NAV_ITEMS,
  isSectionEnabled,
  sectionCopy,
  sectionOrder,
  yearsOfExcellence,
  type SectionCopy,
  type SectionMap,
  type SiteSectionKey,
} from '@/lib/siteContent';

// ─── The public site's one data layer ────────────────────────────────────────
// Every template renders from this hook. The CMS semantics live here and only
// here — null records, `active` filtering, displayOrder, enabled flags, fallback
// copy — so a new template is markup, never another copy of these rules. Adding
// a template must never mean re-deriving this.

export interface SiteMedia {
  src: string;
  alt: string;
  videoUrl?: string;
}

export interface SiteContentView {
  loading: boolean;
  /** The raw payload, for the few fields templates read directly (header, contact, holiday, floating settings). */
  content: WebsiteContent;
  sections: SectionMap;

  schoolName: string;
  tagline: string;
  /** Where every "apply / enquire / read more" action points, from the CMS header CTA. */
  enquiryUrl: string;
  yearsOfExcellence: number | null;

  navItems: WebsiteNavigationItem[];
  socials: WebsiteSocialLink[];
  heroSlides: WebsiteHeroSlide[];
  heroButtons: WebsiteHeroButton[];
  /** The first few features — the pillar strip under the hero. */
  stripFeatures: WebsiteFeature[];
  /** Whatever the strip didn't take — the highlight grid inside the about block. */
  aboutHighlights: WebsiteFeature[];
  statistics: WebsiteStatistic[];
  toppers: WebsiteTopper[];
  galleryItems: WebsiteGalleryItem[];
  testimonials: WebsiteTestimonial[];
  whyChoosePoints: WebsiteWhyChoosePoint[];

  /** Gallery photos only (no video entries) — what the lightbox and section imagery draw from. */
  photos: WebsiteGalleryItem[];
  aboutMedia: SiteMedia;
  whyChooseImage: string;

  copy: Record<
    'announcement' | 'features' | 'about' | 'statistics' | 'toppers' | 'gallery' | 'whyChoose' | 'testimonials' | 'admission',
    SectionCopy
  >;

  /** True when the CMS didn't disable the section AND there's content to show. */
  shows: Record<SiteSectionKey, boolean>;
  /** The CMS's displayOrder for a section, falling back to the template's own position. */
  order: (key: SiteSectionKey, fallback: number) => number;
}

const STRIP_FEATURE_COUNT = 5;

/**
 * One block of a template's body. `keys` carries the section(s) it renders with
 * the position the template would give them; a block covering two sections (a
 * gallery sharing a row with "why choose us", say) takes the earlier position of
 * the two.
 */
export interface TemplateBlock {
  id: string;
  keys: [SiteSectionKey, number][];
  node: ReactNode;
}

/** Applies the CMS's displayOrder to a template's blocks, keeping the template's own order as the tie-break. */
export function orderBlocks(
  blocks: TemplateBlock[],
  order: SiteContentView['order'],
): { id: string; node: ReactNode }[] {
  return blocks
    .map((block) => ({
      id: block.id,
      node: block.node,
      order: Math.min(...block.keys.map(([key, position]) => order(key, position))),
      fallback: Math.min(...block.keys.map(([, position]) => position)),
    }))
    .sort((a, b) => a.order - b.order || a.fallback - b.fallback)
    .map(({ id, node }) => ({ id, node }));
}

export function useSiteContent(): SiteContentView {
  const { theme } = useTheme();
  const [content, setContent] = useState<WebsiteContent>(EMPTY_WEBSITE_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A failed request keeps the empty content shell — the page still renders
    // its chrome and a name-only hero rather than going blank.
    getWebsiteContent()
      .then(setContent)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return useMemo(() => {
    const sections = buildSectionMap(content.sections);

    const navItems = activeSorted(content.navigationItems);
    const features = activeSorted(content.features);
    const galleryItems = activeSorted(content.galleryItems);
    const statistics = activeSorted(content.statistics);
    const testimonials = activeSorted(content.testimonials);
    const whyChoosePoints = activeSorted(content.whyChoosePoints);
    const toppers = content.toppers.filter((topper) => topper.active !== false).sort((a, b) => a.rank - b.rank);

    const stripFeatures = features.slice(0, STRIP_FEATURE_COUNT);
    const aboutHighlights = features.slice(STRIP_FEATURE_COUNT);

    const photos = galleryItems.filter((item) => (item.type ?? '').toUpperCase() !== 'VIDEO');
    const video = galleryItems.find((item) => (item.type ?? '').toUpperCase() === 'VIDEO');

    const schoolName = content.setting?.schoolName?.trim() || theme.companyName || 'SQR School';
    const establishedYear = content.setting?.establishedYear;

    const copy: SiteContentView['copy'] = {
      announcement: sectionCopy(sections, 'ANNOUNCEMENT', {
        eyebrow: 'Latest Announcement',
        title: '',
        description: '',
      }),
      features: sectionCopy(sections, 'FEATURES', { eyebrow: '', title: '', description: '' }),
      about: sectionCopy(sections, 'ABOUT', {
        eyebrow: 'About Us',
        title: establishedYear ? `Excellence in Education Since ${establishedYear}` : 'Excellence in Education',
        description: '',
      }),
      statistics: sectionCopy(sections, 'STATISTICS', { eyebrow: '', title: '', description: '' }),
      toppers: sectionCopy(sections, 'TOPPERS', {
        eyebrow: 'Achievements',
        title: toppers.find((topper) => topper.session)?.session
          ? `Our Toppers (${toppers.find((topper) => topper.session)?.session})`
          : 'Our Toppers',
        description: '',
      }),
      gallery: sectionCopy(sections, 'GALLERY', { eyebrow: 'Campus Life', title: 'Gallery', description: '' }),
      whyChoose: sectionCopy(sections, 'WHY_CHOOSE', { eyebrow: '', title: 'Why Choose Us?', description: '' }),
      testimonials: sectionCopy(sections, 'TESTIMONIALS', {
        eyebrow: 'Testimonials',
        title: 'What Parents Say',
        description: '',
      }),
      admission: sectionCopy(sections, 'ADMISSION_CTA', {
        eyebrow: 'Admissions',
        title: 'Admissions are now open',
        description: '',
      }),
    };

    const enabledWith = (key: SiteSectionKey, hasContent: boolean) => hasContent && isSectionEnabled(sections, key);

    return {
      loading,
      content,
      sections,

      schoolName,
      tagline: content.setting?.tagline?.trim() || '',
      enquiryUrl: content.header?.ctaUrl?.trim() || '#contact',
      yearsOfExcellence: yearsOfExcellence(establishedYear),

      // The CMS's own navigation wins; the defaults only keep the header usable
      // while nothing is configured.
      navItems: navItems.length > 0 ? navItems : DEFAULT_NAV_ITEMS,
      socials: activeSorted(content.socialLinks),
      heroSlides: activeSorted(content.heroSlides),
      heroButtons: content.heroButtons,
      stripFeatures,
      aboutHighlights,
      statistics,
      toppers,
      galleryItems,
      testimonials,
      whyChoosePoints,

      photos,
      aboutMedia: {
        // A VIDEO entry holds its video URL in imageUrl, so the still always
        // comes from a photo and the video only drives the play button.
        src: photos[0]?.imageUrl ?? '/images/building.jpg',
        alt: `${schoolName} campus`,
        videoUrl: video?.imageUrl,
      },
      whyChooseImage: photos[1]?.imageUrl ?? photos[0]?.imageUrl ?? '/images/faculty.jpg',

      copy,

      shows: {
        HERO: isSectionEnabled(sections, 'HERO'),
        ANNOUNCEMENT: isSectionEnabled(sections, 'ANNOUNCEMENT'),
        FEATURES: enabledWith('FEATURES', stripFeatures.length > 0),
        ABOUT: enabledWith('ABOUT', Boolean(sections.ABOUT) || aboutHighlights.length > 0),
        STATISTICS: enabledWith('STATISTICS', statistics.length > 0),
        TOPPERS: enabledWith('TOPPERS', toppers.length > 0),
        GALLERY: enabledWith('GALLERY', galleryItems.length > 0),
        WHY_CHOOSE: enabledWith('WHY_CHOOSE', whyChoosePoints.length > 0),
        TESTIMONIALS: enabledWith('TESTIMONIALS', testimonials.length > 0),
        // Pure copy — there's no list to infer it from, so it renders only when
        // the CMS actually configured the section.
        ADMISSION_CTA: enabledWith('ADMISSION_CTA', Boolean(sections.ADMISSION_CTA)),
      },
      order: (key, fallback) => sectionOrder(sections, key, fallback),
    };
  }, [content, loading, theme.companyName]);
}

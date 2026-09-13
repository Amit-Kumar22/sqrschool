import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BookOpen,
  Bus,
  Building2,
  CalendarDays,
  Compass,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  Laptop,
  Leaf,
  Lightbulb,
  Medal,
  Music,
  Palette,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Utensils,
  Volleyball,
} from 'lucide-react';
import type { WebsiteSection } from './websiteSettingService';
import type { WebsiteNavigationItem } from './freeService';

// ─── Public site presentation helpers ────────────────────────────────────────
// Pure data helpers shared by the home page and its section components: which
// layout the active theme asks for, which sections the CMS enabled and in what
// order, and how to turn the CMS's free-text icon/platform keywords into
// something renderable.

// ─── Layout variant ───────────────────────────────────────────────────────────

/**
 * `classic` — full-bleed photographic hero, full-width gallery strip, and the
 *   "why choose us" panel sitting beside the testimonials.
 * `split` — light split hero (copy beside a framed photo), a statistics band,
 *   and the gallery sharing a row with "why choose us" above full-width
 *   testimonials.
 */
export type SiteVariant = 'classic' | 'split';

const SITE_VARIANTS: SiteVariant[] = ['classic', 'split'];

/**
 * The active colour theme's `themeType` doubles as the layout selector for the
 * public site: "PREMIUM" renders the classic layout, "PREMIUM-2" the split one.
 * Any further numbered type (PREMIUM-3, …) cycles back through the list, so an
 * unrecognized value still renders a complete page instead of nothing.
 */
export function resolveSiteVariant(themeType?: string | null): SiteVariant {
  const suffix = Number(themeType?.match(/(\d+)\s*$/)?.[1] ?? 1);
  const index = Number.isFinite(suffix) && suffix > 0 ? (suffix - 1) % SITE_VARIANTS.length : 0;
  return SITE_VARIANTS[index];
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export type SiteSectionKey =
  | 'HERO'
  | 'ANNOUNCEMENT'
  | 'FEATURES'
  | 'ABOUT'
  | 'STATISTICS'
  | 'TOPPERS'
  | 'GALLERY'
  | 'WHY_CHOOSE'
  | 'TESTIMONIALS'
  | 'ADMISSION_CTA';

// The backend's sectionType enum is ANNOUNCEMENT, FEATURES, ABOUT, TOPPERS,
// GALLERY, WHY_CHOOSE_US, STATISTICS, TESTIMONIALS, ADMISSION_CTA and FOOTER.
// Matching on the letters alone (and accepting the obvious singular/plural and
// naming variants) keeps the page rendering if that enum gains a spelling —
// FOOTER is the one value with no block of its own, since the footer is always
// rendered as page chrome.
const SECTION_ALIASES: Record<string, SiteSectionKey> = {
  HERO: 'HERO',
  HEROSLIDER: 'HERO',
  BANNER: 'HERO',
  SLIDER: 'HERO',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  ANNOUNCEMENTS: 'ANNOUNCEMENT',
  NOTICE: 'ANNOUNCEMENT',
  FEATURE: 'FEATURES',
  FEATURES: 'FEATURES',
  HIGHLIGHT: 'FEATURES',
  HIGHLIGHTS: 'FEATURES',
  ABOUT: 'ABOUT',
  ABOUTUS: 'ABOUT',
  STAT: 'STATISTICS',
  STATS: 'STATISTICS',
  STATISTIC: 'STATISTICS',
  STATISTICS: 'STATISTICS',
  COUNTER: 'STATISTICS',
  TOPPER: 'TOPPERS',
  TOPPERS: 'TOPPERS',
  RESULT: 'TOPPERS',
  RESULTS: 'TOPPERS',
  GALLERY: 'GALLERY',
  PHOTO: 'GALLERY',
  PHOTOS: 'GALLERY',
  WHYCHOOSE: 'WHY_CHOOSE',
  WHYCHOOSEUS: 'WHY_CHOOSE',
  WHYUS: 'WHY_CHOOSE',
  TESTIMONIAL: 'TESTIMONIALS',
  TESTIMONIALS: 'TESTIMONIALS',
  PARENT: 'TESTIMONIALS',
  PARENTS: 'TESTIMONIALS',
  PARENTSAY: 'TESTIMONIALS',
  WHATPARENTSSAY: 'TESTIMONIALS',
  ADMISSIONCTA: 'ADMISSION_CTA',
  ADMISSION: 'ADMISSION_CTA',
  ADMISSIONS: 'ADMISSION_CTA',
};

export type SectionMap = Partial<Record<SiteSectionKey, WebsiteSection>>;

/** Indexes the CMS sections by the home-page block they configure; unknown section types are ignored. */
export function buildSectionMap(sections: WebsiteSection[]): SectionMap {
  const map: SectionMap = {};
  sections.forEach((section) => {
    const key = SECTION_ALIASES[(section.sectionType ?? '').toUpperCase().replace(/[^A-Z]/g, '')];
    if (key && !map[key]) map[key] = section;
  });
  return map;
}

export interface SectionCopy {
  eyebrow: string;
  title: string;
  description: string;
}

/** Section heading copy, with the page's own wording as the fallback for anything the CMS left blank. */
export function sectionCopy(map: SectionMap, key: SiteSectionKey, fallback: SectionCopy): SectionCopy {
  const section = map[key];
  return {
    eyebrow: section?.eyebrow?.trim() || fallback.eyebrow,
    title: section?.title?.trim() || fallback.title,
    description: section?.description?.trim() || fallback.description,
  };
}

/** A section renders unless the CMS explicitly disabled it — an absent record means "not configured", not "hidden". */
export function isSectionEnabled(map: SectionMap, key: SiteSectionKey): boolean {
  return map[key]?.enabled !== false;
}

/** The CMS's displayOrder for a block, falling back to the page's own default position. */
export function sectionOrder(map: SectionMap, key: SiteSectionKey, fallback: number): number {
  const order = map[key]?.displayOrder;
  return typeof order === 'number' && order > 0 ? order : fallback;
}

// ─── Lists ────────────────────────────────────────────────────────────────────

/**
 * Drops records the CMS deactivated and applies its displayOrder. Records
 * without an explicit flag/order keep their API position, so a list the backend
 * already sorted isn't reshuffled.
 */
export function activeSorted<T extends { active?: boolean; displayOrder?: number }>(items: T[]): T[] {
  return items
    .filter((item) => item.active !== false)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.displayOrder ?? a.index) - (b.item.displayOrder ?? b.index) || a.index - b.index)
    .map(({ item }) => item);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

// Features and statistics carry a free-text `icon` keyword ("smart classroom",
// "trophy", "bus") rather than an icon reference, so map keywords onto Lucide
// icons and fall back to a neutral glyph instead of rendering a blank slot.
const ICON_KEYWORDS: [string, LucideIcon][] = [
  ['facult', Users],
  ['teacher', Users],
  ['staff', Users],
  ['student', GraduationCap],
  ['graduat', GraduationCap],
  ['alumni', GraduationCap],
  ['classroom', Laptop],
  ['smart', Laptop],
  ['computer', Laptop],
  ['tech', Laptop],
  ['digital', Laptop],
  ['librar', BookOpen],
  ['book', BookOpen],
  ['curriculum', BookOpen],
  ['academ', BookOpen],
  ['lab', FlaskConical],
  ['science', FlaskConical],
  ['experiment', FlaskConical],
  ['sport', Volleyball],
  ['play', Volleyball],
  ['ground', Volleyball],
  ['gym', Volleyball],
  ['fitness', Volleyball],
  ['art', Palette],
  ['craft', Palette],
  ['creativ', Palette],
  ['music', Music],
  ['dance', Music],
  ['secur', ShieldCheck],
  ['safe', ShieldCheck],
  ['cctv', ShieldCheck],
  ['health', HeartPulse],
  ['medical', HeartPulse],
  ['care', HeartPulse],
  ['transport', Bus],
  ['bus', Bus],
  ['cafeteria', Utensils],
  ['canteen', Utensils],
  ['food', Utensils],
  ['hostel', Building2],
  ['campus', Building2],
  ['infrastructure', Building2],
  ['building', Building2],
  ['award', Award],
  ['achiev', Trophy],
  ['trophy', Trophy],
  ['winner', Trophy],
  ['topper', Medal],
  ['rank', Medal],
  ['result', Medal],
  ['star', Star],
  ['rating', Star],
  ['holistic', Leaf],
  ['value', Leaf],
  ['environment', Leaf],
  ['eco', Leaf],
  ['green', Leaf],
  ['idea', Lightbulb],
  ['innovat', Lightbulb],
  ['future', Rocket],
  ['career', Rocket],
  ['goal', Target],
  ['mission', Target],
  ['vision', Compass],
  ['guidance', Compass],
  ['counsel', Compass],
  ['event', CalendarDays],
  ['calendar', CalendarDays],
  ['year', CalendarDays],
  ['excellence', Sparkles],
];

// Longest keyword first — otherwise a short entry that happens to be a
// substring of a more specific one ("art" inside "smart classroom") would win
// the match before the intended keyword is ever checked.
const SORTED_ICON_KEYWORDS = [...ICON_KEYWORDS].sort((a, b) => b[0].length - a[0].length);

export function resolveIcon(keyword?: string | null, fallback: LucideIcon = Sparkles): LucideIcon {
  const key = (keyword ?? '').toLowerCase();
  if (!key) return fallback;
  return SORTED_ICON_KEYWORDS.find(([word]) => key.includes(word))?.[1] ?? fallback;
}

// ─── Social links ─────────────────────────────────────────────────────────────

// lucide-react ships no brand icons, so social glyphs are inline SVG paths
// keyed by the CMS's platform enum (FACEBOOK, INSTAGRAM, …).
const SOCIAL_PATHS: Record<string, string> = {
  FACEBOOK:
    'M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.3-1.5 1.6-1.5H16.5V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10.5H7.5v3H9.8V21h3.7z',
  INSTAGRAM:
    'M12 8.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4zm0 6.1a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8zM16 4H8a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4zm2.7 12a2.7 2.7 0 0 1-2.7 2.7H8A2.7 2.7 0 0 1 5.3 16V8A2.7 2.7 0 0 1 8 5.3h8A2.7 2.7 0 0 1 18.7 8v8zM16.4 7.6a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8z',
  TWITTER:
    'M13.6 10.6 19.9 4h-1.5l-5.5 5.7L8.5 4H4l6.6 8.9L4 20h1.5l5.8-6 4.7 6H20l-6.4-9.4zM11.6 13l-.7-.9L6 6h2.3l4.3 5.8.7.9 5.6 7.5h-2.3L11.6 13z',
  YOUTUBE:
    'M21.6 8.2a2.7 2.7 0 0 0-1.9-1.9C18 5.8 12 5.8 12 5.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 8.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 3.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-3.8zM10 14.8V9.2L15 12l-5 2.8z',
  LINKEDIN:
    'M6.9 8.4H3.6V20h3.3V8.4zM5.2 3.2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zM20.4 13.2c0-3-1.6-4.5-3.8-4.5-1.7 0-2.5.95-2.9 1.6V8.4H10.4c.05.95 0 11.6 0 11.6h3.3v-6.5c0-.3 0-.6.1-.8.25-.6.8-1.2 1.7-1.2 1.2 0 1.7.9 1.7 2.3V20h3.2v-6.8z',
  WHATSAPP:
    'M12 3.5a8.4 8.4 0 0 0-7.2 12.7L3.6 20.5l4.4-1.2A8.4 8.4 0 1 0 12 3.5zm0 1.6a6.8 6.8 0 1 1-3.5 12.6l-.3-.2-2.6.7.7-2.5-.2-.3A6.8 6.8 0 0 1 12 5.1zm3.9 9c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1l-.6.7c-.1.1-.2.2-.4.1a5.6 5.6 0 0 1-2.8-2.4c-.2-.3.2-.3.5-1 .1-.1 0-.3 0-.4l-.6-1.4c-.2-.4-.3-.3-.5-.3h-.4c-.1 0-.4.1-.6.3-.8.9-.6 2 .1 3a8.6 8.6 0 0 0 3.4 3c1.6.6 1.9.5 2.3.5.4 0 1.2-.5 1.4-1 .2-.5.2-.9.1-1-.1-.1-.2-.1-.4-.2z',
};

const SOCIAL_ALIASES: Record<string, string> = { X: 'TWITTER', FB: 'FACEBOOK', INSTA: 'INSTAGRAM', YT: 'YOUTUBE' };

/** Inline SVG path for a CMS social platform, or null when the platform isn't one we have a glyph for. */
export function socialIconPath(platform?: string | null): string | null {
  const key = (platform ?? '').toUpperCase().replace(/[^A-Z]/g, '');
  return SOCIAL_PATHS[SOCIAL_ALIASES[key] ?? key] ?? null;
}

// ─── Misc formatting ──────────────────────────────────────────────────────────

/** "20+" style years-in-operation figure, or null when the CMS has no established year. */
export function yearsOfExcellence(establishedYear?: number | null): number | null {
  if (!establishedYear || establishedYear < 1800) return null;
  const years = new Date().getFullYear() - establishedYear;
  return years > 0 ? years : null;
}

/** wa.me deep link with the CMS's prefilled message; digits only, since wa.me rejects spaces and symbols. */
export function whatsappHref(phone: string, message?: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

/** Initials fallback for a testimonial/topper with no photo. */
export function initials(name?: string | null): string {
  return (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

// Anchors match the section ids rendered on the home page, so the nav still
// works when the CMS has no navigation items configured yet.
export const DEFAULT_NAV_ITEMS: WebsiteNavigationItem[] = [
  { id: -1, label: 'Home', url: '#home', displayOrder: 1, active: true },
  { id: -2, label: 'About Us', url: '#about', displayOrder: 2, active: true },
  { id: -3, label: 'Toppers', url: '#toppers', displayOrder: 3, active: true },
  { id: -4, label: 'Gallery', url: '#gallery', displayOrder: 4, active: true },
  { id: -5, label: 'Contact Us', url: '#contact', displayOrder: 5, active: true },
];

import { api, type ApiEnvelope } from './api';
import { API_ENDPOINTS } from './config';
import type { Holiday } from './holidayService';
import type {
  WebsiteContact,
  WebsiteFeature,
  WebsiteFloatingSetting,
  WebsiteGalleryItem,
  WebsiteHeader,
  WebsiteHeroButton,
  WebsiteHeroSlide,
  WebsiteSection,
  WebsiteSocialLink,
  WebsiteStatistic,
  WebsiteTopper,
  WebsiteWhyChoosePoint,
} from './websiteSettingService';

// ─── Free/public website content ─────────────────────────────────────────────
// The single endpoint behind the public home page, consumed before any session
// exists — same pattern as getPublicActiveTheme (api.ts). It returns every
// piece of CMS content the page renders in one {result} envelope, reusing the
// same entity shapes the Website Settings admin tabs write
// (lib/websiteSettingService.ts).
//
// Every single-object field can come back null while that part of the CMS is
// still empty (confirmed against the live API), so consumers must null-check
// rather than assume a record exists.

export interface WebsiteSetting {
  id: number;
  schoolName: string;
  tagline: string;
  establishedYear: number;
  board: string;
  active: boolean;
  // The CMS stores its own palette alongside the colour-theme record. The site
  // paints from the active colour theme instead (ThemeContext → CSS vars), so
  // these are typed for completeness but deliberately not applied — one source
  // of truth for colors keeps the admin theme switcher authoritative.
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  lightBackground: string;
  whiteColor: string;
}

export interface WebsiteNavigationItem {
  id: number;
  label: string;
  url: string;
  displayOrder: number;
  active: boolean;
}

export interface WebsiteTestimonial {
  id: number;
  quote: string;
  parentName: string;
  relation: string;
  photoUrl: string;
  rating: number;
  displayOrder: number;
  active: boolean;
}

export interface WebsiteContent {
  setting: WebsiteSetting | null;
  contact: WebsiteContact | null;
  header: WebsiteHeader | null;
  holiday: Holiday | null;
  floatingSetting: WebsiteFloatingSetting | null;
  sections: WebsiteSection[];
  socialLinks: WebsiteSocialLink[];
  navigationItems: WebsiteNavigationItem[];
  heroSlides: WebsiteHeroSlide[];
  heroButtons: WebsiteHeroButton[];
  features: WebsiteFeature[];
  galleryItems: WebsiteGalleryItem[];
  testimonials: WebsiteTestimonial[];
  statistics: WebsiteStatistic[];
  toppers: WebsiteTopper[];
  whyChoosePoints: WebsiteWhyChoosePoint[];
}

/** Content shape with nothing configured yet — the shared starting point for both a failed request and a half-filled CMS. */
export const EMPTY_WEBSITE_CONTENT: WebsiteContent = {
  setting: null,
  contact: null,
  header: null,
  holiday: null,
  floatingSetting: null,
  sections: [],
  socialLinks: [],
  navigationItems: [],
  heroSlides: [],
  heroButtons: [],
  features: [],
  galleryItems: [],
  testimonials: [],
  statistics: [],
  toppers: [],
  whyChoosePoints: [],
};

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/**
 * Everything the public home page renders, in one request.
 *
 * Normalizes the response so a missing or null list can't reach the UI as
 * `undefined` — a half-configured CMS should hide the sections it has no
 * content for, not crash the page.
 */
export const getWebsiteContent = async (): Promise<WebsiteContent> => {
  const response = await api.get<ApiEnvelope<WebsiteContent>>(API_ENDPOINTS.FREE.WEBSITE_CONTENT);
  const result = response.data?.result;
  if (!result) return EMPTY_WEBSITE_CONTENT;

  return {
    setting: result.setting ?? null,
    contact: result.contact ?? null,
    header: result.header ?? null,
    holiday: result.holiday ?? null,
    floatingSetting: result.floatingSetting ?? null,
    sections: asArray<WebsiteSection>(result.sections),
    socialLinks: asArray<WebsiteSocialLink>(result.socialLinks),
    navigationItems: asArray<WebsiteNavigationItem>(result.navigationItems),
    heroSlides: asArray<WebsiteHeroSlide>(result.heroSlides),
    heroButtons: asArray<WebsiteHeroButton>(result.heroButtons),
    features: asArray<WebsiteFeature>(result.features),
    galleryItems: asArray<WebsiteGalleryItem>(result.galleryItems),
    testimonials: asArray<WebsiteTestimonial>(result.testimonials),
    statistics: asArray<WebsiteStatistic>(result.statistics),
    toppers: asArray<WebsiteTopper>(result.toppers),
    whyChoosePoints: asArray<WebsiteWhyChoosePoint>(result.whyChoosePoints),
  };
};

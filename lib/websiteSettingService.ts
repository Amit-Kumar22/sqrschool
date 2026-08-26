import { api } from './api';
import { API_ENDPOINTS } from './config';

// ─── Website Settings service ───────────────────────────────────────────────
// CMS-style endpoints behind the public marketing site — header, hero,
// sections, features, stats, toppers, gallery, socials, contact and the
// floating widgets. Every resource shares the same raw Page<T> shape (no
// {result} envelope), same as lib/academicYearService.ts.

export interface WebsitePage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  last: boolean;
}

export interface WebsiteListParams {
  page?: number;
  size?: number;
}

/** Builds the get/create/update/delete/list functions for a standard `{id, ...payload}` CRUD resource. */
function buildCrud<T, TPayload>(endpoints: {
  LIST: string;
  CREATE: string;
  GET: (id: number) => string;
  UPDATE: (id: number) => string;
  DELETE: (id: number) => string;
}) {
  const list = async ({ page = 0, size = 200 }: WebsiteListParams = {}): Promise<WebsitePage<T>> => {
    const response = await api.get<WebsitePage<T>>(endpoints.LIST, { params: { page, size } });
    return response.data;
  };
  const get = async (id: number): Promise<T> => {
    const response = await api.get<T>(endpoints.GET(id));
    return response.data;
  };
  const create = async (data: TPayload): Promise<T> => {
    const response = await api.post<T>(endpoints.CREATE, data);
    return response.data;
  };
  const update = async (id: number, data: TPayload): Promise<T> => {
    const response = await api.put<T>(endpoints.UPDATE(id), data);
    return response.data;
  };
  const remove = async (id: number): Promise<void> => {
    await api.delete(endpoints.DELETE(id));
  };
  return { list, get, create, update, remove };
}

// ─── Website Header ──────────────────────────────────────────────────────────

export interface WebsiteHeader {
  id: number;
  logoUrl: string;
  logoAlt: string;
  mobileMenuEnabled: boolean;
  ctaLabel: string;
  ctaUrl: string;
}

export type WebsiteHeaderPayload = Omit<WebsiteHeader, 'id'>;

const headerCrud = buildCrud<WebsiteHeader, WebsiteHeaderPayload>(API_ENDPOINTS.WEBSITE_HEADER);
export const getWebsiteHeaders = headerCrud.list;
export const getWebsiteHeader = headerCrud.get;
export const createWebsiteHeader = headerCrud.create;
export const updateWebsiteHeader = headerCrud.update;
export const deleteWebsiteHeader = headerCrud.remove;

// ─── Website Hero Slide ──────────────────────────────────────────────────────

export interface WebsiteHeroSlide {
  id: number;
  backgroundImageUrl: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  displayOrder: number;
  active: boolean;
}

export type WebsiteHeroSlidePayload = Omit<WebsiteHeroSlide, 'id'>;

const heroSlideCrud = buildCrud<WebsiteHeroSlide, WebsiteHeroSlidePayload>(API_ENDPOINTS.WEBSITE_HERO_SLIDE);
export const getWebsiteHeroSlides = heroSlideCrud.list;
export const getWebsiteHeroSlide = heroSlideCrud.get;
export const createWebsiteHeroSlide = heroSlideCrud.create;
export const updateWebsiteHeroSlide = heroSlideCrud.update;
export const deleteWebsiteHeroSlide = heroSlideCrud.remove;

// ─── Website Hero Button ─────────────────────────────────────────────────────
// Belongs to a hero slide (heroSlideId). The list response also nests the
// full parent slide as `heroSlide` — kept here for display convenience.

export interface WebsiteHeroButton {
  id: number;
  heroSlide: WebsiteHeroSlide | null;
  label: string;
  url: string;
  style: string;
  icon: string;
  displayOrder: number;
  heroSlideId: number;
}

export interface WebsiteHeroButtonPayload {
  heroSlideId: number;
  label: string;
  url: string;
  style: string;
  icon: string;
  displayOrder: number;
}

const heroButtonEndpoints = API_ENDPOINTS.WEBSITE_HERO_BUTTON;

export const getWebsiteHeroButtons = async ({
  page = 0,
  size = 200,
  heroSlideId,
}: WebsiteListParams & { heroSlideId?: number } = {}): Promise<WebsitePage<WebsiteHeroButton>> => {
  const response = await api.get<WebsitePage<WebsiteHeroButton>>(heroButtonEndpoints.LIST, {
    params: { page, size, heroSlideId },
  });
  return response.data;
};
export const getWebsiteHeroButton = async (id: number): Promise<WebsiteHeroButton> => {
  const response = await api.get<WebsiteHeroButton>(heroButtonEndpoints.GET(id));
  return response.data;
};
export const createWebsiteHeroButton = async (data: WebsiteHeroButtonPayload): Promise<WebsiteHeroButton> => {
  const response = await api.post<WebsiteHeroButton>(heroButtonEndpoints.CREATE, data);
  return response.data;
};
export const updateWebsiteHeroButton = async (id: number, data: WebsiteHeroButtonPayload): Promise<WebsiteHeroButton> => {
  const response = await api.put<WebsiteHeroButton>(heroButtonEndpoints.UPDATE(id), data);
  return response.data;
};
export const deleteWebsiteHeroButton = async (id: number): Promise<void> => {
  await api.delete(heroButtonEndpoints.DELETE(id));
};

// ─── Website Section ──────────────────────────────────────────────────────────

export interface WebsiteSection {
  id: number;
  sectionType: string;
  enabled: boolean;
  displayOrder: number;
  eyebrow: string;
  title: string;
  description: string;
}

export type WebsiteSectionPayload = Omit<WebsiteSection, 'id'>;

const sectionCrud = buildCrud<WebsiteSection, WebsiteSectionPayload>(API_ENDPOINTS.WEBSITE_SECTION);
export const getWebsiteSections = sectionCrud.list;
export const getWebsiteSection = sectionCrud.get;
export const createWebsiteSection = sectionCrud.create;
export const updateWebsiteSection = sectionCrud.update;
export const deleteWebsiteSection = sectionCrud.remove;

// ─── Website Feature ──────────────────────────────────────────────────────────

export interface WebsiteFeature {
  id: number;
  icon: string;
  title: string;
  description: string;
  displayOrder: number;
  active: boolean;
}

export type WebsiteFeaturePayload = Omit<WebsiteFeature, 'id'>;

const featureCrud = buildCrud<WebsiteFeature, WebsiteFeaturePayload>(API_ENDPOINTS.WEBSITE_FEATURE);
export const getWebsiteFeatures = featureCrud.list;
export const getWebsiteFeature = featureCrud.get;
export const createWebsiteFeature = featureCrud.create;
export const updateWebsiteFeature = featureCrud.update;
export const deleteWebsiteFeature = featureCrud.remove;

// ─── Website Statistic ────────────────────────────────────────────────────────

export interface WebsiteStatistic {
  id: number;
  icon: string;
  number: string;
  label: string;
  displayOrder: number;
  active: boolean;
}

export type WebsiteStatisticPayload = Omit<WebsiteStatistic, 'id'>;

const statisticCrud = buildCrud<WebsiteStatistic, WebsiteStatisticPayload>(API_ENDPOINTS.WEBSITE_STATISTIC);
export const getWebsiteStatistics = statisticCrud.list;
export const getWebsiteStatistic = statisticCrud.get;
export const createWebsiteStatistic = statisticCrud.create;
export const updateWebsiteStatistic = statisticCrud.update;
export const deleteWebsiteStatistic = statisticCrud.remove;

// ─── Website Why-Choose Point ─────────────────────────────────────────────────

export interface WebsiteWhyChoosePoint {
  id: number;
  point: string;
  displayOrder: number;
  active: boolean;
}

export type WebsiteWhyChoosePointPayload = Omit<WebsiteWhyChoosePoint, 'id'>;

const whyChoosePointCrud = buildCrud<WebsiteWhyChoosePoint, WebsiteWhyChoosePointPayload>(
  API_ENDPOINTS.WEBSITE_WHY_CHOOSE_POINT,
);
export const getWebsiteWhyChoosePoints = whyChoosePointCrud.list;
export const getWebsiteWhyChoosePoint = whyChoosePointCrud.get;
export const createWebsiteWhyChoosePoint = whyChoosePointCrud.create;
export const updateWebsiteWhyChoosePoint = whyChoosePointCrud.update;
export const deleteWebsiteWhyChoosePoint = whyChoosePointCrud.remove;

// ─── Website Topper ────────────────────────────────────────────────────────────

export interface WebsiteTopper {
  id: number;
  rank: number;
  name: string;
  photoUrl: string;
  percentage: number;
  stream: string;
  session: string;
  active: boolean;
}

export type WebsiteTopperPayload = Omit<WebsiteTopper, 'id'>;

const topperCrud = buildCrud<WebsiteTopper, WebsiteTopperPayload>(API_ENDPOINTS.WEBSITE_TOPPER);
export const getWebsiteToppers = topperCrud.list;
export const getWebsiteTopper = topperCrud.get;
export const createWebsiteTopper = topperCrud.create;
export const updateWebsiteTopper = topperCrud.update;
export const deleteWebsiteTopper = topperCrud.remove;

// ─── Website Gallery Item ──────────────────────────────────────────────────────

export interface WebsiteGalleryItem {
  id: number;
  title: string;
  category: string;
  imageUrl: string;
  type: string;
  displayOrder: number;
  active: boolean;
}

export type WebsiteGalleryItemPayload = Omit<WebsiteGalleryItem, 'id'>;

const galleryItemCrud = buildCrud<WebsiteGalleryItem, WebsiteGalleryItemPayload>(API_ENDPOINTS.WEBSITE_GALLERY_ITEM);
export const getWebsiteGalleryItems = galleryItemCrud.list;
export const getWebsiteGalleryItem = galleryItemCrud.get;
export const createWebsiteGalleryItem = galleryItemCrud.create;
export const updateWebsiteGalleryItem = galleryItemCrud.update;
export const deleteWebsiteGalleryItem = galleryItemCrud.remove;

// ─── Website Social Link ───────────────────────────────────────────────────────

export interface WebsiteSocialLink {
  id: number;
  platform: string;
  url: string;
  active: boolean;
  displayOrder: number;
}

export type WebsiteSocialLinkPayload = Omit<WebsiteSocialLink, 'id'>;

const socialLinkCrud = buildCrud<WebsiteSocialLink, WebsiteSocialLinkPayload>(API_ENDPOINTS.WEBSITE_SOCIAL_LINK);
export const getWebsiteSocialLinks = socialLinkCrud.list;
export const getWebsiteSocialLink = socialLinkCrud.get;
export const createWebsiteSocialLink = socialLinkCrud.create;
export const updateWebsiteSocialLink = socialLinkCrud.update;
export const deleteWebsiteSocialLink = socialLinkCrud.remove;

// ─── Website Contact ────────────────────────────────────────────────────────────

export interface WebsiteContact {
  id: number;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  workingDays: string;
  workingTime: string;
}

export type WebsiteContactPayload = Omit<WebsiteContact, 'id'>;

const contactCrud = buildCrud<WebsiteContact, WebsiteContactPayload>(API_ENDPOINTS.WEBSITE_CONTACT);
export const getWebsiteContacts = contactCrud.list;
export const getWebsiteContact = contactCrud.get;
export const createWebsiteContact = contactCrud.create;
export const updateWebsiteContact = contactCrud.update;
export const deleteWebsiteContact = contactCrud.remove;

// ─── Website Floating Setting ─────────────────────────────────────────────────

export interface WebsiteFloatingSetting {
  id: number;
  backToTopEnabled: boolean;
  whatsappEnabled: boolean;
  whatsappPhone: string;
  whatsappMessage: string;
  quickEnquiryEnabled: boolean;
  quickEnquiryLabel: string;
  quickEnquiryUrl: string;
}

export type WebsiteFloatingSettingPayload = Omit<WebsiteFloatingSetting, 'id'>;

const floatingSettingCrud = buildCrud<WebsiteFloatingSetting, WebsiteFloatingSettingPayload>(
  API_ENDPOINTS.WEBSITE_FLOATING_SETTING,
);
export const getWebsiteFloatingSettings = floatingSettingCrud.list;
export const getWebsiteFloatingSetting = floatingSettingCrud.get;
export const createWebsiteFloatingSetting = floatingSettingCrud.create;
export const updateWebsiteFloatingSetting = floatingSettingCrud.update;
export const deleteWebsiteFloatingSetting = floatingSettingCrud.remove;

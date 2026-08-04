import type { ThemePayload } from './api';

export type PresetColors = Omit<ThemePayload, 'id' | 'themeName' | 'themeType' | 'companyName'>;

export interface ThemePreset {
  key: string;
  label: string;
  description: string;
  /** The one preset we recommend as the site-wide default — surfaced first, badged in the gallery. */
  recommended?: boolean;
  colors: PresetColors;
}

/**
 * Curated, professionally paired color palettes offered to Super Admins as a
 * starting point in the Theme Settings gallery. Picking one pre-fills the
 * "create theme" form (lib/api.ts createTheme/activateTheme still own persistence
 * and activation) — nothing here talks to the backend directly.
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    key: 'prestige-indigo',
    label: 'Prestige Indigo',
    description: 'Deep indigo & gold. Our recommended default — polished and distinctly academic.',
    recommended: true,
    colors: {
      primaryColor: '#4F46E5',
      secondaryColor: '#1E1B4B',
      backgroundColor: '#F8FAFC',
      textColor: '#334155',
      headingColor: '#14123B',
      linkColor: '#4F46E5',
      buttonBgColor: '#F59E0B',
      buttonTextColor: '#1E1B4B',
      navbarBgColor: '#14123B',
      navbarTextColor: '#F8FAFC',
      footerBgColor: '#0B0A24',
      footerTextColor: '#E2E8F0',
      bottomNavBgColor: '#14123B',
      bottomNavTextColor: '#F8FAFC',
    },
  },
  {
    key: 'emerald-scholar',
    label: 'Emerald Scholar',
    description: 'Rich emerald with warm gold accents — fresh and confident.',
    colors: {
      primaryColor: '#059669',
      secondaryColor: '#064E3B',
      backgroundColor: '#F8FAFC',
      textColor: '#334155',
      headingColor: '#052E2B',
      linkColor: '#059669',
      buttonBgColor: '#F59E0B',
      buttonTextColor: '#052E2B',
      navbarBgColor: '#052E2B',
      navbarTextColor: '#F0FDF4',
      footerBgColor: '#031B18',
      footerTextColor: '#DCFCE7',
      bottomNavBgColor: '#052E2B',
      bottomNavTextColor: '#F0FDF4',
    },
  },
  {
    key: 'royal-crimson',
    label: 'Royal Crimson',
    description: 'Bold crimson & charcoal for a distinguished, formal look.',
    colors: {
      primaryColor: '#BE123C',
      secondaryColor: '#1C1917',
      backgroundColor: '#FFFFFF',
      textColor: '#292524',
      headingColor: '#1C1917',
      linkColor: '#BE123C',
      buttonBgColor: '#EAB308',
      buttonTextColor: '#1C1917',
      navbarBgColor: '#1C1917',
      navbarTextColor: '#FAFAF9',
      footerBgColor: '#0C0A09',
      footerTextColor: '#E7E5E4',
      bottomNavBgColor: '#1C1917',
      bottomNavTextColor: '#FAFAF9',
    },
  },
  {
    key: 'ocean-teal',
    label: 'Ocean Teal',
    description: 'Calming teal & navy — a modern, approachable feel.',
    colors: {
      primaryColor: '#0D9488',
      secondaryColor: '#0F172A',
      backgroundColor: '#F8FAFC',
      textColor: '#334155',
      headingColor: '#0F172A',
      linkColor: '#0D9488',
      buttonBgColor: '#F59E0B',
      buttonTextColor: '#0F172A',
      navbarBgColor: '#0F172A',
      navbarTextColor: '#F0FDFA',
      footerBgColor: '#020617',
      footerTextColor: '#E2E8F0',
      bottomNavBgColor: '#0F172A',
      bottomNavTextColor: '#F0FDFA',
    },
  },
  {
    key: 'slate-modern',
    label: 'Slate Modern',
    description: 'Minimal monochrome slate with a sharp blue accent.',
    colors: {
      primaryColor: '#2563EB',
      secondaryColor: '#334155',
      backgroundColor: '#FFFFFF',
      textColor: '#334155',
      headingColor: '#0F172A',
      linkColor: '#2563EB',
      buttonBgColor: '#2563EB',
      buttonTextColor: '#FFFFFF',
      navbarBgColor: '#1E293B',
      navbarTextColor: '#F8FAFC',
      footerBgColor: '#0F172A',
      footerTextColor: '#E2E8F0',
      bottomNavBgColor: '#1E293B',
      bottomNavTextColor: '#F8FAFC',
    },
  },
  {
    key: 'sunset-amber',
    label: 'Sunset Amber',
    description: 'Warm amber & deep brown — friendly and energetic.',
    colors: {
      primaryColor: '#D97706',
      secondaryColor: '#451A03',
      backgroundColor: '#FFFBEB',
      textColor: '#451A03',
      headingColor: '#451A03',
      linkColor: '#D97706',
      buttonBgColor: '#DC2626',
      buttonTextColor: '#FFFFFF',
      navbarBgColor: '#451A03',
      navbarTextColor: '#FFFBEB',
      footerBgColor: '#291006',
      footerTextColor: '#FDE68A',
      bottomNavBgColor: '#451A03',
      bottomNavTextColor: '#FFFBEB',
    },
  },
];

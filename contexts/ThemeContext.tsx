'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getActiveTheme, getPublicActiveTheme, type Theme } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

// "Prestige Indigo" — our recommended premium default, shown until the
// backend theme loads and if the request fails. Also selectable as a preset
// from the Super Admin theme gallery (lib/themePresets.ts) so it can be
// restored with one click. Distinct on purpose from the other in-house
// projects' defaults (travel portal = blue, CRA panel = teal).
export const DEFAULT_THEME: Theme = {
  id: 0,
  themeName: 'Prestige Indigo',
  themeType: 'SYSTEM',
  companyName: 'SQR School',
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
  isActive: true,
  bottomNavBgColor: '#14123B',
  bottomNavTextColor: '#F8FAFC',
};

// Maps Theme fields -> the CSS custom properties declared in globals.css
const CSS_VAR_MAP: Record<keyof Theme, string | null> = {
  id: null,
  themeName: null,
  themeType: null,
  companyName: null,
  isActive: null,
  primaryColor: '--theme-primary',
  secondaryColor: '--theme-secondary',
  backgroundColor: '--theme-background',
  textColor: '--theme-text',
  headingColor: '--theme-heading',
  linkColor: '--theme-link',
  buttonBgColor: '--theme-button-bg',
  buttonTextColor: '--theme-button-text',
  navbarBgColor: '--theme-navbar-bg',
  navbarTextColor: '--theme-navbar-text',
  footerBgColor: '--theme-footer-bg',
  footerTextColor: '--theme-footer-text',
  bottomNavBgColor: '--theme-bottom-nav-bg',
  bottomNavTextColor: '--theme-bottom-nav-text',
};

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  (Object.keys(CSS_VAR_MAP) as (keyof Theme)[]).forEach((key) => {
    const cssVar = CSS_VAR_MAP[key];
    const value = theme[key];
    if (cssVar && typeof value === 'string' && value) {
      root.style.setProperty(cssVar, value);
    }
  });
}

interface ThemeContextValue {
  theme: Theme;
  loading: boolean;
  /** Re-fetches the active theme from the backend and re-applies it. Call this after activating a different theme. */
  refresh: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // Signed-in users get the authenticated active theme; signed-out
      // visitors (landing page, login) use the public/free endpoint instead.
      const active = isAuthenticated() ? await getActiveTheme() : await getPublicActiveTheme();
      if (active) {
        setThemeState(active);
        applyThemeToDocument(active);
      }
    } catch {
      // Backend unreachable or no active theme yet — keep the default theme.
      applyThemeToDocument(DEFAULT_THEME);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    applyThemeToDocument(DEFAULT_THEME);
    load();
  }, [load]);

  const value = useMemo(() => ({ theme, loading, refresh: load }), [theme, loading, load]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

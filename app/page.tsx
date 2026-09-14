'use client';

import { useTheme } from '@/contexts/ThemeContext';
import SiteSkeleton from '@/components/site/sections/SiteSkeleton';
import { resolveTemplateKey, TEMPLATES } from '@/components/site/templates/registry';
import { useSiteContent } from '@/components/site/useSiteContent';

/**
 * Public home page.
 *
 * Two moving parts, both driven by the active colour theme: its colors paint
 * the page through CSS variables (ThemeContext), and its `themeType` selects
 * which template renders it. Everything else lives behind those two seams —
 * `useSiteContent` owns the CMS data, the template owns the markup — so adding
 * a layout never touches this file.
 */
export default function Home() {
  const { theme, loading: themeLoading } = useTheme();
  const site = useSiteContent();

  // Wait for both: rendering before the theme resolves would flash the default
  // palette and the fallback template's layout.
  if (site.loading || themeLoading) return <SiteSkeleton />;

  // Looked up from the registry's module-level map, so the component identity
  // is stable and switching themes swaps templates without remounting the page.
  const Template = TEMPLATES[resolveTemplateKey(theme.themeType)];
  return <Template site={site} />;
}

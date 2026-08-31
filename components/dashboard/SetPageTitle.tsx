'use client';

import { usePageTitle } from './PageTitleContext';

/** Tiny client leaf so Server Component pages can set the Topbar title without becoming client components themselves. */
export default function SetPageTitle({ title }: { title: string }) {
  usePageTitle(title);
  return null;
}

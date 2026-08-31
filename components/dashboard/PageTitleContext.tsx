'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface PageTitleContextValue {
  title: string;
  setTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextValue | null>(null);

/** Wraps the dashboard shell so any page can push its title up into the Topbar. */
export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('');
  return <PageTitleContext.Provider value={{ title, setTitle }}>{children}</PageTitleContext.Provider>;
}

/** Reads the current page title — used by Topbar. */
export function usePageTitleValue(): string {
  return useContext(PageTitleContext)?.title ?? '';
}

/** Sets the Topbar's title for as long as the calling component is mounted. Prefer <SetPageTitle> from a Server Component page. */
export function usePageTitle(title: string) {
  const ctx = useContext(PageTitleContext);
  useEffect(() => {
    ctx?.setTitle(title);
  }, [ctx, title]);
}

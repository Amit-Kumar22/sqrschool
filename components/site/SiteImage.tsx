'use client';

import { useState } from 'react';

interface SiteImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Shown when the CMS has no URL for this slot, or the one it has fails to load. */
  fallback?: string;
}

/**
 * Image for CMS-provided URLs.
 *
 * Deliberately a plain <img> rather than next/image: these URLs come from the
 * Website Settings admin, so their host is whatever the school pasted in
 * (unsplash, a CDN, the backend itself) and next/image would need every one of
 * those hosts allow-listed in next.config to render at all. A broken or empty
 * URL falls back to a bundled photo so a half-filled CMS never leaves a hole in
 * the layout.
 */
export default function SiteImage({ src, alt, className = '', fallback = '/images/building.jpg' }: SiteImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = !src || failed ? fallback : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

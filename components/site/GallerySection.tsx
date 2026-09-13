'use client';

import { useState } from 'react';
import { ArrowRight, Expand, Play } from 'lucide-react';
import type { WebsiteGalleryItem } from '@/lib/websiteSettingService';
import type { SectionCopy } from '@/lib/siteContent';
import ImageLightbox from '@/components/ui/ImageLightbox';
import SectionHeading from './SectionHeading';
import SiteImage from './SiteImage';

interface GallerySectionProps {
  items: WebsiteGalleryItem[];
  copy: SectionCopy;
  /** `wide` runs the full page width; `panel` is the card that shares a row with another section. */
  layout: 'wide' | 'panel';
  ctaUrl: string;
}

const isVideo = (item: WebsiteGalleryItem) => (item.type ?? '').toUpperCase() === 'VIDEO';

/** Campus gallery. Photos open in the lightbox; video entries link out to their source. */
export default function GallerySection({ items, copy, layout, ctaUrl }: GallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  const wide = layout === 'wide';
  const shown = items.slice(0, wide ? 10 : 6);
  // Nothing to link to unless the CMS holds more than this row shows.
  const hasMore = items.length > shown.length;
  // The lightbox only ever steps through photos, so index against that list.
  const photos = items.filter((item) => !isVideo(item));

  const tile = (item: WebsiteGalleryItem) => {
    const photoIndex = photos.findIndex((photo) => photo.id === item.id);
    const caption = item.title || item.category;

    const media = (
      <>
        <SiteImage
          src={item.imageUrl}
          alt={caption || 'Gallery photo'}
          className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            wide ? 'h-40 sm:h-44' : 'h-24 sm:h-28'
          }`}
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white opacity-0 ring-1 ring-white/30 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          {isVideo(item) ? <Play size={13} fill="currentColor" /> : <Expand size={13} />}
        </span>
        {caption && (
          <span
            className={`absolute inset-x-0 bottom-0 truncate px-3 pb-2 text-left font-semibold text-white ${
              wide ? 'text-xs sm:text-sm' : 'text-[11px]'
            }`}
          >
            {caption}
          </span>
        )}
      </>
    );

    const className =
      'group relative block w-full overflow-hidden rounded-xl shadow-premium transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-primary';

    return isVideo(item) ? (
      <a
        key={item.id}
        href={item.imageUrl || '#'}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
        aria-label={`Play ${caption || 'gallery video'}`}
      >
        {media}
      </a>
    ) : (
      <button
        key={item.id}
        type="button"
        onClick={() => setLightboxIndex(Math.max(photoIndex, 0))}
        className={`${className} cursor-zoom-in`}
        aria-label={`View ${caption || 'gallery photo'}`}
      >
        {media}
      </button>
    );
  };

  const lightbox = lightboxIndex !== null && photos.length > 0 && (
    <ImageLightbox
      images={photos.map((photo) => ({
        src: photo.imageUrl,
        alt: photo.title || 'Gallery photo',
        caption: photo.title || photo.category,
      }))}
      index={lightboxIndex}
      onClose={() => setLightboxIndex(null)}
      onIndexChange={setLightboxIndex}
    />
  );

  if (!wide) {
    return (
      <section id="gallery" className="flex h-full min-w-0 flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-premium">
        <SectionHeading align="left" eyebrow={copy.eyebrow} title={copy.title} />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{shown.map(tile)}</div>
        {hasMore && (
          <a
            href={ctaUrl}
            className="mt-auto inline-flex items-center gap-1.5 self-start pt-5 text-xs font-bold uppercase tracking-wide text-primary transition-colors hover:text-button-bg"
          >
            View More Photos <ArrowRight size={14} />
          </a>
        )}
        {lightbox}
      </section>
    );
  }

  return (
    <section id="gallery" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.description} />
      <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{shown.map(tile)}</div>
      {hasMore && (
        <div className="mt-8 text-center">
          <a
            href={ctaUrl}
            className="inline-flex items-center gap-2 rounded-md bg-button-bg px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-button-text shadow-glow-button transition-all hover:-translate-y-0.5 hover:shadow-glow-button-lg"
          >
            View More Photos <ArrowRight size={15} />
          </a>
        </div>
      )}
      {lightbox}
    </section>
  );
}

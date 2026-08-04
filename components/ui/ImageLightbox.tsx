'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function ImageLightbox({ images, index, onClose, onIndexChange }: ImageLightboxProps) {
  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, goPrev, goNext]);

  const active = images[index];

  return (
    <div
      className="animate-fade-in-up fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={active.caption || active.alt}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-premium-sm ring-1 ring-white/20 transition-all hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-premium sm:top-6 sm:right-6"
      >
        <X size={18} />
      </button>

      <span className="absolute top-4 left-4 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20 sm:top-6 sm:left-6">
        {index + 1} / {images.length}
      </span>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white shadow-premium-sm ring-1 ring-white/20 transition-all hover:-translate-x-0.5 hover:bg-white/20 hover:shadow-premium sm:left-6 sm:h-12 sm:w-12"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next image"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white shadow-premium-sm ring-1 ring-white/20 transition-all hover:translate-x-0.5 hover:bg-white/20 hover:shadow-premium sm:right-6 sm:h-12 sm:w-12"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      <div
        key={active.src}
        className="animate-scale-in relative flex max-h-[80vh] w-full max-w-3xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-[65vh] w-full overflow-hidden rounded-2xl bg-black shadow-glow-primary-lg">
          <Image src={active.src} alt={active.alt} fill className="object-contain" sizes="100vw" priority />
        </div>
        {active.caption && <p className="mt-4 text-center text-sm font-medium text-white/90">{active.caption}</p>}
      </div>
    </div>
  );
}

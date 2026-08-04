'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import ImageLightbox from '@/components/ui/ImageLightbox';

const GALLERY_IMAGES = [
  { src: '/images/building.jpg', alt: 'Main academic block', caption: 'Main Academic Block' },
  { src: '/images/campus-gate.jpg', alt: 'Secure campus entrance', caption: 'Secure Campus Entrance' },
  { src: '/images/faculty.jpg', alt: 'Our faculty team', caption: 'Our Dedicated Faculty' },
  { src: '/images/creativity.jpg', alt: 'Art and creativity studio', caption: 'Art & Creativity Studio' },
  { src: '/images/sports.jpg', alt: 'Sports complex and grounds', caption: 'Sports Complex & Grounds' },
  { src: '/images/primary.jpg', alt: 'Primary wing classroom', caption: 'Primary Wing Classrooms' },
  { src: '/images/middle.jpg', alt: 'Middle school science lab', caption: 'Middle School Science Lab' },
];

export default function Gallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) {
          const idx = Number((mostVisible.target as HTMLElement).dataset.index);
          if (!Number.isNaN(idx)) setActive(idx);
        }
      },
      { root: track, threshold: [0.6] }
    );

    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToIndex = (idx: number) => {
    itemRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  };

  const scrollByCard = (dir: 1 | -1) => {
    scrollToIndex(Math.min(Math.max(active + dir, 0), GALLERY_IMAGES.length - 1));
  };

  return (
    <section id="gallery" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Gallery</p>
        <h2 className="mt-2 text-2xl font-bold text-heading sm:text-3xl">A glimpse into campus life</h2>
        <p className="mt-2 text-sm text-ink/60">Swipe, scroll or use the arrows — tap any photo to view it full screen.</p>
      </div>

      <div className="relative mt-10">
        <div
          ref={trackRef}
          className="scrollbar-thin flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
        >
          {GALLERY_IMAGES.map((img, idx) => (
            <div
              key={img.src}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              data-index={idx}
              className="group relative h-64 w-[78%] shrink-0 snap-start overflow-hidden rounded-xl shadow-glow-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-primary-lg sm:w-[46%] md:w-[31%]"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className="absolute inset-0 h-full w-full cursor-zoom-in"
                aria-label={`View ${img.caption} in full screen`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(min-width: 768px) 31vw, (min-width: 640px) 46vw, 78vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />
                <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white opacity-0 shadow-premium-sm ring-1 ring-white/20 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                  <Expand size={14} />
                </span>
                <span className="absolute bottom-3 left-3 text-left text-sm font-semibold text-white">
                  {img.caption}
                </span>
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          disabled={active === 0}
          aria-label="Previous images"
          className="absolute top-1/2 -left-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-heading shadow-premium transition-all hover:-translate-x-0.5 hover:shadow-glow-primary disabled:pointer-events-none disabled:opacity-40 sm:flex"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          disabled={active === GALLERY_IMAGES.length - 1}
          aria-label="Next images"
          className="absolute top-1/2 -right-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-heading shadow-premium transition-all hover:translate-x-0.5 hover:shadow-glow-primary disabled:pointer-events-none disabled:opacity-40 sm:flex"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-center gap-1.5">
        {GALLERY_IMAGES.map((img, idx) => (
          <button
            key={img.src}
            type="button"
            onClick={() => scrollToIndex(idx)}
            aria-label={`Go to image ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              active === idx ? 'w-6 bg-primary' : 'w-1.5 bg-primary/25 hover:bg-primary/50'
            }`}
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={GALLERY_IMAGES}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </section>
  );
}

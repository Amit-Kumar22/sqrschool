'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Download, Phone, Play } from 'lucide-react';
import type { WebsiteHeroButton, WebsiteHeroSlide } from '@/lib/websiteSettingService';

// Slider behaviour shared by every template's hero: the fallback slide, the
// auto-advance, and which buttons belong to the slide on screen. Templates own
// the markup; none of them re-implement this.

const SLIDE_INTERVAL_MS = 7000;

interface UseHeroSlidesOptions {
  slides: WebsiteHeroSlide[];
  buttons: WebsiteHeroButton[];
  /** Used for the stand-in slide when the CMS has none, so the page never opens on an empty banner. */
  schoolName: string;
  tagline: string;
}

export function useHeroSlides({ slides, buttons, schoolName, tagline }: UseHeroSlidesOptions) {
  const resolvedSlides = useMemo<WebsiteHeroSlide[]>(
    () =>
      slides.length > 0
        ? slides
        : [
            {
              id: 0,
              backgroundImageUrl: '/images/building.jpg',
              badge: 'Welcome to',
              title: schoolName,
              subtitle: tagline,
              description: '',
              displayOrder: 1,
              active: true,
            },
          ],
    [slides, schoolName, tagline],
  );

  const [index, setIndex] = useState(0);
  const count = resolvedSlides.length;

  // Clamp, in case the CMS now returns fewer slides than the index we're on.
  const active = resolvedSlides[Math.min(index, count - 1)];
  const activeButtons = buttons.filter((button) => button.heroSlideId === active.id);

  const goTo = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count]);

  return { slides: resolvedSlides, active, activeButtons, index, count, goTo };
}

/**
 * Hero buttons carry a free-text icon keyword. These are the ones that make
 * sense on a hero CTA — a "play" here is a tour video, not a playground, which
 * is why this is separate from the shared resolveIcon keywords.
 */
export function heroButtonIcon(keyword?: string | null): LucideIcon {
  const key = (keyword ?? '').toLowerCase();
  if (key.includes('play') || key.includes('video') || key.includes('tour')) return Play;
  if (key.includes('call') || key.includes('phone')) return Phone;
  if (key.includes('download') || key.includes('brochure')) return Download;
  return ArrowRight;
}

export const isPrimaryHeroButton = (button: WebsiteHeroButton) =>
  (button.style ?? '').toUpperCase() !== 'SECONDARY';

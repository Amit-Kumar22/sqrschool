'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Scroll-snap carousel plumbing shared by the toppers, gallery and testimonial
 * rows: arrow paging, edge detection for disabling those arrows, and the page
 * dots. Scrolling is left to the browser (the track is a plain overflow-x
 * element), so touch swipe and keyboard scrolling keep working for free.
 */
export function useCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ atStart: true, atEnd: true, page: 0, pageCount: 1 });

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { scrollLeft, clientWidth, scrollWidth } = track;
    // A 1px cushion — fractional widths keep scrollLeft just shy of the end.
    setState({
      atStart: scrollLeft <= 1,
      atEnd: scrollLeft + clientWidth >= scrollWidth - 1,
      page: clientWidth > 0 ? Math.round(scrollLeft / clientWidth) : 0,
      pageCount: clientWidth > 0 ? Math.max(1, Math.ceil(scrollWidth / clientWidth)) : 1,
    });
  }, []);

  useEffect(() => {
    sync();
    const track = trackRef.current;
    if (!track) return;
    // Card widths are percentage-based, so a resize changes the page count.
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    return () => observer.disconnect();
  }, [sync]);

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
  }, []);

  const goToPage = useCallback((page: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: page * track.clientWidth, behavior: 'smooth' });
  }, []);

  return { trackRef, onScroll: sync, scrollByPage, goToPage, ...state };
}

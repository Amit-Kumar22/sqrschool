'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Imperative (vanilla Leaflet) rather than a react-leaflet wrapper — this
// project only depends on the base `leaflet` package. Touches `window` at
// import time, so every caller must load this via next/dynamic with
// `ssr: false`.

// Leaflet's default marker icon resolves its image paths relative to the
// bundled JS, which breaks under Next's bundler. A small inline SVG pin
// sidesteps that entirely instead of fighting asset resolution.
const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="#b45309"/>
    <circle cx="15" cy="15" r="6" fill="white"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

interface SchoolLocationMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  /** Meters — draws a translucent circle around the marker when set (the geofence radius). */
  radiusMeters?: number;
  /** Marker can be dragged and the map clicked to move it — off for read-only previews. */
  interactive?: boolean;
  onChange?: (lat: number, lng: number) => void;
  className?: string;
}

export default function SchoolLocationMap({
  latitude,
  longitude,
  zoom = 16,
  radiusMeters,
  interactive = false,
  onChange,
  className = 'h-64 w-full',
}: SchoolLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Mount once — the map instance itself isn't recreated on prop changes,
  // only updated imperatively below.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom,
      dragging: true,
      scrollWheelZoom: interactive,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([latitude, longitude], { icon: pinIcon, draggable: interactive }).addTo(map);
    if (interactive) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeRef.current?.(pos.lat, pos.lng);
      });
      map.on('click', (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onChangeRef.current?.(e.latlng.lat, e.latlng.lng);
      });
    }

    mapRef.current = map;
    markerRef.current = marker;

    // Leaflet sizes itself off the container's dimensions at creation time —
    // if the container was hidden (e.g. inside a modal's mount transition)
    // it initializes at 0x0 and needs a nudge once it's actually visible.
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-center + move the marker when the coordinates change from outside
  // (search result picked, "use current location", manual lat/lng edit).
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const current = marker.getLatLng();
    if (current.lat === latitude && current.lng === longitude) return;
    marker.setLatLng([latitude, longitude]);
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude]);

  // Geofence radius circle — added/updated/removed as radiusMeters changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!radiusMeters || radiusMeters <= 0) {
      circleRef.current?.remove();
      circleRef.current = null;
      return;
    }
    if (!circleRef.current) {
      circleRef.current = L.circle([latitude, longitude], {
        radius: radiusMeters,
        color: '#b45309',
        fillColor: '#f59e0b',
        fillOpacity: 0.12,
        weight: 1.5,
      }).addTo(map);
    } else {
      circleRef.current.setLatLng([latitude, longitude]);
      circleRef.current.setRadius(radiusMeters);
    }
  }, [latitude, longitude, radiusMeters]);

  return <div ref={containerRef} className={`${className} rounded-lg`} />;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Check, Crosshair, Loader2, MapPin, Search, X } from 'lucide-react';
import { getCurrentPosition, reverseGeocode, searchAddress, type GeoSearchResult } from '@/lib/geo';
import { IconButton } from '@/components/ui/Button';
import Button from '@/components/ui/Button';

// Touches `window` at import time — must stay client-only.
const SchoolLocationMap = dynamic(() => import('./SchoolLocationMap'), { ssr: false });

const DEFAULT_CENTER = { latitude: 20.5937, longitude: 78.9629 }; // India, used only when no coordinates exist yet

interface SchoolLocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onCancel: () => void;
  onConfirm: (latitude: number, longitude: number, address: string) => void;
}

/** Full-screen "Pick School Location" overlay — search, drag-to-place marker, or use current GPS position. */
export default function SchoolLocationPicker({ initialLatitude, initialLongitude, onCancel, onConfirm }: SchoolLocationPickerProps) {
  const [position, setPosition] = useState({
    latitude: initialLatitude ?? DEFAULT_CENTER.latitude,
    longitude: initialLongitude ?? DEFAULT_CENTER.longitude,
  });
  const [address, setAddress] = useState('Resolving…');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const movePin = (latitude: number, longitude: number) => {
    setPosition({ latitude, longitude });
    setResults([]);
  };

  // Reverse-geocode whenever the pin settles somewhere new, debounced so
  // dragging doesn't fire a request per frame.
  useEffect(() => {
    setAddress('Resolving…');
    if (addressDebounce.current) clearTimeout(addressDebounce.current);
    addressDebounce.current = setTimeout(() => {
      reverseGeocode(position.latitude, position.longitude)
        .then((result) => setAddress(result || 'Address unavailable'))
        .catch(() => setAddress('Address unavailable'));
    }, 500);
    return () => {
      if (addressDebounce.current) clearTimeout(addressDebounce.current);
    };
  }, [position.latitude, position.longitude]);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchAddress(value));
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    setError('');
    try {
      const coords = await getCurrentPosition();
      movePin(coords.latitude, coords.longitude);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not determine your current location.');
    } finally {
      setLocating(false);
    }
  };

  // Portaled straight to <body> — this picker is opened from inside
  // SchoolFormModal, whose box has a `transform` (the scale-in mount
  // animation) that creates a containing block for `position: fixed`
  // descendants. Without the portal this overlay gets trapped and clipped
  // inside that small modal instead of covering the viewport.
  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="animate-scale-in flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-premium-sm">
              <MapPin size={16} />
            </span>
            <h2 className="text-base font-semibold text-slate-900">Pick School Location</h2>
          </div>
          <IconButton icon={X} label="Close" onClick={onCancel} />
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search area, landmark, or address…"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 shadow-premium-sm placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
              />
              {results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-premium">
                  {results.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        movePin(result.latitude, result.longitude);
                        setQuery(result.displayName);
                      }}
                      className="block w-full truncate px-3 py-2 text-left text-xs text-slate-600 hover:bg-amber-50"
                    >
                      {result.displayName}
                    </button>
                  ))}
                </div>
              )}
              {searching && (
                <Loader2 size={14} className="absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-slate-400" />
              )}
            </div>
            <Button type="button" variant="secondary" icon={locating ? undefined : Crosshair} loading={locating} onClick={handleUseCurrentLocation}>
              Use Current Location
            </Button>
          </div>

          <SchoolLocationMap
            latitude={position.latitude}
            longitude={position.longitude}
            interactive
            onChange={movePin}
            className="h-80 w-full sm:h-96"
          />

          <div className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs sm:grid-cols-3">
            <div>
              <p className="text-slate-400 uppercase">Latitude</p>
              <p className="font-mono text-slate-700">{position.latitude.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase">Longitude</p>
              <p className="font-mono text-slate-700">{position.longitude.toFixed(6)}</p>
            </div>
            <div className="sm:col-span-1">
              <p className="text-slate-400 uppercase">Address</p>
              <p className="truncate text-slate-700">{address}</p>
            </div>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" icon={Check} onClick={() => onConfirm(position.latitude, position.longitude, address)}>
            Confirm Location
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

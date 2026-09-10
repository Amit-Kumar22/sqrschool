// ─── Geo helpers ─────────────────────────────────────────────────────────────
// Shared by the school location picker (Website Settings) and the attendance
// check-in/out flows — both need the browser's current GPS position, and the
// former also needs free-text search / reverse geocoding via OpenStreetMap's
// Nominatim service.

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Wraps navigator.geolocation in a promise with readable error messages. */
export const getCurrentPosition = (): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Location is not supported on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('Location permission was denied. Please allow location access and try again.'));
        } else {
          reject(new Error('Could not determine your current location.'));
        }
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });

export interface GeoSearchResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

// Both calls go through this app's own /api/geo/* route handlers rather than
// nominatim.openstreetmap.org directly — Nominatim's public instance doesn't
// return Access-Control-Allow-Origin, so a browser-side fetch straight to it
// is silently blocked by CORS. The route handlers proxy it server-side,
// where CORS doesn't apply. See app/api/geo/search|reverse/route.ts.

/** Free-text address/landmark search — used by the map picker's search box. */
export const searchAddress = async (query: string): Promise<GeoSearchResult[]> => {
  if (!query.trim()) return [];
  const response = await fetch(`/api/geo/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) return [];
  const data: Array<{ display_name: string; lat: string; lon: string }> = await response.json();
  return data.map((item) => ({ displayName: item.display_name, latitude: Number(item.lat), longitude: Number(item.lon) }));
};

/** Reverse-geocodes a lat/lng into a human-readable address. */
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const response = await fetch(`/api/geo/reverse?lat=${lat}&lon=${lng}`);
  if (!response.ok) return '';
  const data: { display_name?: string } = await response.json();
  return data.display_name ?? '';
};

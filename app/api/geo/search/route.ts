import { NextRequest, NextResponse } from 'next/server';

// Proxies Nominatim's /search so the browser never calls
// nominatim.openstreetmap.org directly — its public instance doesn't return
// Access-Control-Allow-Origin, so a client-side fetch is silently blocked by
// CORS. A same-origin route handler sidesteps that (server-to-server fetches
// aren't subject to CORS) and lets us set the User-Agent Nominatim's usage
// policy asks for, which browsers refuse to let scripts override anyway.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json([]);

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
  const response = await fetch(url, { headers: { 'User-Agent': 'SqrSchool-AttendanceApp/1.0', Accept: 'application/json' } });
  if (!response.ok) return NextResponse.json([]);
  return NextResponse.json(await response.json());
}

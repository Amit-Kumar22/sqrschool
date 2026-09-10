import { NextRequest, NextResponse } from 'next/server';

// See app/api/geo/search/route.ts — same CORS-proxy reasoning, for Nominatim's /reverse.
export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat');
  const lon = request.nextUrl.searchParams.get('lon');
  if (!lat || !lon) return NextResponse.json({ display_name: '' });

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const response = await fetch(url, { headers: { 'User-Agent': 'SqrSchool-AttendanceApp/1.0', Accept: 'application/json' } });
  if (!response.ok) return NextResponse.json({ display_name: '' });
  return NextResponse.json(await response.json());
}

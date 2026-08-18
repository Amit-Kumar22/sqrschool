'use client';

import { useEffect, useState } from 'react';
import { getProfile } from './api';

// Pages/forms scoped to "my school" (class, academic year, staff, etc.) get
// their schoolCode from here instead of a school-picker dropdown — every
// logged-in staff/principal account belongs to exactly one school, and the
// profile endpoint is the authoritative source for it. If the profile has no
// schoolCode (e.g. an admin account not yet linked to one school), callers
// get back an empty string — that's not an error, it's the signal for
// callers to use fetchAcrossAllSchools (see schoolService.ts) instead of a
// single-school fetch, since the backend has no "every school" query mode.
export function useSchoolCode() {
  const [schoolCode, setSchoolCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (cancelled) return;
        setSchoolCode(profile.schoolCode ?? '');
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your school details.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { schoolCode, loading, error };
}

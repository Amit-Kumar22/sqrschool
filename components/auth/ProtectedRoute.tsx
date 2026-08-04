'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getDashboardByRole, getUserRole, isAuthenticated, type Role } from '@/lib/auth';

/**
 * Client-side guard for role panels — checks the session cookie/localStorage
 * in the browser rather than via a server-side proxy/middleware. Redirects
 * to /login if signed out, or to the user's own dashboard if signed in
 * under a different role than this route requires.
 */
export default function ProtectedRoute({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    const currentRole = getUserRole();
    if (currentRole && currentRole !== role) {
      router.replace(getDashboardByRole(currentRole));
      return;
    }

    setAllowed(true);
  }, [role, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 shadow-premium">
          <Loader2 size={24} className="animate-spin text-indigo-600" />
        </span>
      </div>
    );
  }

  return <>{children}</>;
}

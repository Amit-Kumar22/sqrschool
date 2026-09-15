'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, LogOut, Menu, UserCircle } from 'lucide-react';
import { getRoleBasePath, type SessionUser } from '@/lib/auth';
import { ROLE_LABELS } from './navConfig';
import { usePageTitleValue } from './PageTitleContext';

interface TopbarProps {
  user: SessionUser | null;
  onOpenSidebar: () => void;
  onLogout: () => void;
}

const formatToday = () =>
  new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/** Deep-green bar that continues the Sidebar chrome — intentionally not theme-bound (see Sidebar.tsx). */
export default function Topbar({ user, onOpenSidebar, onLogout }: TopbarProps) {
  const pageTitle = usePageTitleValue();
  const [menuOpen, setMenuOpen] = useState(false);
  // The shell only mounts client-side (behind ProtectedRoute), so reading the clock here can't cause a hydration mismatch.
  const [today] = useState(formatToday);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const initials = (user?.fullName ?? '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-forest-800 via-forest-900 to-forest-800 px-4 shadow-premium sm:px-6">
      {/* Decorative layer clipped on its own — the header itself can't clip, or the profile dropdown would be cut off */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 right-1/4 h-32 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
      </div>

      <div className="relative flex min-w-0 items-center gap-3">
        <button
          className="shrink-0 rounded-lg p-1.5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          onClick={onOpenSidebar}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="truncate text-base font-semibold text-white sm:text-lg">{pageTitle}</span>
      </div>

      <div className="relative flex items-center gap-2 sm:gap-4">
        <span className="hidden items-center gap-2 rounded-xl bg-white/[0.07] py-1.5 pr-3 pl-1.5 text-xs font-medium text-slate-100 ring-1 ring-white/10 md:inline-flex">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300">
            <CalendarDays size={14} />
          </span>
          {today}
        </span>

        <span className="hidden h-8 w-px bg-white/15 md:block" />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition-colors hover:bg-white/10"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white shadow-glow-brand ring-2 ring-white/20">
              {initials}
            </div>
            {user && (
              <div className="hidden text-left leading-tight sm:block">
                <p className="max-w-40 truncate text-sm font-semibold text-white">{user.fullName}</p>
                <p className="text-xs text-brand-200/70">{ROLE_LABELS[user.role]}</p>
              </div>
            )}
            <ChevronDown size={15} className={`text-slate-300 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && user && (
            <div className="animate-scale-in absolute right-0 z-40 mt-2 w-60 origin-top-right rounded-xl border border-slate-100 bg-white p-1.5 shadow-premium-lg">
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-3 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <Link
                href={`/${getRoleBasePath(user.role)}/profile`}
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                <UserCircle size={16} /> My Profile
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

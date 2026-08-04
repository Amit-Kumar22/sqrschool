'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, UserCircle } from 'lucide-react';
import { getRoleBasePath, type SessionUser } from '@/lib/auth';
import { ROLE_LABELS } from './navConfig';

interface TopbarProps {
  user: SessionUser | null;
  onOpenSidebar: () => void;
  onLogout: () => void;
}

/** Fixed premium dark chrome — unified with Sidebar, intentionally not theme-bound (see Sidebar.tsx). */
export default function Topbar({ user, onOpenSidebar, onLogout }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
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
    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between bg-gradient-to-r from-indigo-950 via-[#151235] to-indigo-950 px-4 shadow-premium sm:px-6">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-1.5 text-slate-200 transition-colors hover:bg-white/10 lg:hidden"
          onClick={onOpenSidebar}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="hidden text-sm font-medium text-slate-300 lg:block">
          {user ? `Welcome back, ${user.fullName.split(' ')[0]}` : ''}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <span className="hidden rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-100 ring-1 ring-white/10 sm:inline-block">
            {ROLE_LABELS[user.role]}
          </span>
        )}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-white/10"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-semibold text-indigo-950 shadow-premium-sm">
              {initials}
            </div>
            <ChevronDown size={14} className={`text-slate-300 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && user && (
            <div className="animate-scale-in absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-xl border border-slate-100 bg-white p-1.5 shadow-premium-lg">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <Link
                href={`/${getRoleBasePath(user.role)}/profile`}
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
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

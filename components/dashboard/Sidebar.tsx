'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, ChevronsRight, GraduationCap, LogOut, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getNavItems, ROLE_LABELS } from './navConfig';
import type { Role } from '@/lib/auth';

interface SidebarProps {
  role: Role;
  open: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onClose: () => void;
  onLogout: () => void;
}

/**
 * Fixed deep-green chrome for every post-login panel (forest-* / brand-*
 * tokens in globals.css). Deliberately NOT built from the admin-editable site
 * theme (--color-navbar-bg etc.) — those only apply to the public marketing
 * site. The internal tool keeps one constant look no matter what theme is active.
 */
export default function Sidebar({ role, open, collapsed, onToggleCollapsed, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const navItems = getNavItems(role);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-gradient-to-b from-forest-800 via-forest-900 to-forest-950 text-slate-100 shadow-premium-lg transition-all duration-300 ease-out lg:relative lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Ambient glow accents — clipped in their own layer so the collapse toggle can overhang the edge */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute -right-12 bottom-10 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        {/* Desktop collapse toggle — floats on the sidebar's edge */}
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-6 -right-3 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-premium-sm transition-all hover:text-brand-600 hover:shadow-premium lg:flex"
        >
          {collapsed ? <ChevronsRight size={13} /> : <ChevronsLeft size={13} />}
        </button>

        <div className={`relative flex h-[72px] shrink-0 items-center justify-between px-4 ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow-brand ring-1 ring-white/25">
              <GraduationCap size={20} />
            </span>
            <div className={`min-w-0 leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="truncate text-[15px] font-bold tracking-wide text-white">{theme.companyName || 'SQR School'}</p>
              <p className="truncate text-[11px] font-medium text-brand-200/70">{ROLE_LABELS[role]} Panel</p>
            </div>
          </div>
          <button
            className="shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative mx-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <p className={`relative px-6 pt-5 pb-2 text-[10px] font-semibold tracking-[0.16em] text-white/40 uppercase ${collapsed ? 'lg:hidden' : ''}`}>
          Main Menu
        </p>

        <nav className={`scrollbar-thin scrollbar-on-dark relative flex-1 space-y-1 overflow-y-auto px-3 pb-3 ${collapsed ? 'lg:pt-4' : ''}`}>
          {navItems.map((item, idx) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                style={{ animationDelay: `${idx * 40}ms` }}
                className={`animate-fade-in-up group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-brand-500 to-brand-400 font-semibold text-white shadow-glow-brand'
                    : 'text-slate-300/90 hover:translate-x-0.5 hover:bg-white/[0.07] hover:text-white'
                } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
              >
                <item.icon
                  size={18}
                  className={`shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-brand-300'}`}
                />
                <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-white/10 p-3">
          <button
            onClick={onLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-slate-300/90 transition-colors hover:bg-rose-500/10 hover:text-rose-200 ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <LogOut size={18} className="shrink-0 text-slate-400 transition-colors group-hover:text-rose-300" />
            <span className={collapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

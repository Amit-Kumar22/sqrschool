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
 * Fixed premium dark chrome for every post-login panel. Deliberately NOT
 * built from the admin-editable site theme (--color-navbar-bg etc.) — those
 * only apply to the public marketing site. The internal tool keeps one
 * constant look no matter what theme is active.
 */
export default function Sidebar({ role, open, collapsed, onToggleCollapsed, onClose, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const navItems = getNavItems(role);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col overflow-hidden bg-gradient-to-b from-indigo-950 via-[#151235] to-slate-950 text-slate-100 shadow-premium-lg transition-all duration-300 ease-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Ambient glow accents — purely decorative premium texture */}
        <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -right-10 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

        {/* Desktop collapse toggle — floats on the sidebar's edge */}
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-6 -right-3 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-premium-sm transition-all hover:text-indigo-600 hover:shadow-premium lg:flex"
        >
          {collapsed ? <ChevronsRight size={13} /> : <ChevronsLeft size={13} />}
        </button>

        <div className="relative flex h-16 shrink-0 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-2.5 font-semibold">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-indigo-950 shadow-premium-sm">
              <GraduationCap size={18} />
            </span>
            <span className={`truncate text-sm ${collapsed ? 'lg:hidden' : ''}`}>{theme.companyName || 'SQR School'}</span>
          </div>
          <button className="shrink-0 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <p className={`relative px-4 pb-2 text-xs font-medium tracking-wide text-slate-400 uppercase ${collapsed ? 'lg:hidden' : ''}`}>
          {ROLE_LABELS[role]} Panel
        </p>

        <nav className="scrollbar-thin relative flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item, idx) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                style={{ animationDelay: `${idx * 40}ms` }}
                className={`animate-fade-in-up group relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:translate-x-0.5 ${
                  active
                    ? 'bg-white/10 font-medium text-white shadow-premium-sm ring-1 ring-white/10'
                    : 'text-slate-300/85 hover:bg-white/5 hover:text-white'
                } ${collapsed ? 'lg:justify-center' : ''}`}
              >
                {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-amber-400" />}
                <item.icon size={17} className={`shrink-0 ${active ? 'text-amber-400' : ''}`} />
                <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-white/10 p-3">
          <button
            onClick={onLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-300/85 transition-colors hover:bg-white/5 hover:text-white ${
              collapsed ? 'lg:justify-center' : ''
            }`}
          >
            <LogOut size={17} className="shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

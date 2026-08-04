'use client';

import { useEffect, useState } from 'react';
import { logoutUser } from '@/lib/api';
import { clearAuth, getUser, type Role, type SessionUser } from '@/lib/auth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const COLLAPSE_STORAGE_KEY = 'sqr.sidebarCollapsed';

interface AppShellProps {
  role: Role;
  children: React.ReactNode;
}

export default function AppShell({ role, children }: AppShellProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setCollapsed(localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Even if the backend call fails, clear the local session so the user
      // isn't stuck signed in on a dead token.
    } finally {
      clearAuth();
      // Hard navigation (not router.replace) — guarantees a clean reload of
      // the public shell instead of racing the 401 interceptor's own
      // window.location redirect or leaving stale client-side state behind.
      window.location.href = '/';
    }
  };

  return (
    // Fixed-height, non-scrolling shell: sidebar and topbar stay put, only
    // <main> scrolls. (Previously the whole document scrolled, which
    // carried the sidebar/topbar away with the page on any tall panel.)
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        role={role}
        open={sidebarOpen}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <Topbar user={user} onOpenSidebar={() => setSidebarOpen(true)} onLogout={handleLogout} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

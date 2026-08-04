import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Palette, UserCircle } from 'lucide-react';
import type { Role } from '@/lib/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Nav items per role. Only SUPERADMIN has APIs beyond auth/profile today
 * (theme management), so the other roles get a Dashboard + Profile shell,
 * ready to grow once their own APIs are wired up.
 */
export function getNavItems(role: Role): NavItem[] {
  const base = role.toLowerCase();
  const items: NavItem[] = [
    { label: 'Dashboard', href: `/${base}/dashboard`, icon: LayoutDashboard },
  ];

  if (role === 'SUPERADMIN') {
    items.push({ label: 'Theme Settings', href: '/superadmin/settings/theme', icon: Palette });
  }

  items.push({ label: 'My Profile', href: `/${base}/profile`, icon: UserCircle });

  return items;
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPERADMIN: 'Super Admin',
  PRINCIPAL: 'Principal',
  TEACHER: 'Teacher',
  STAFF: 'Staff',
  STUDENT: 'Student',
};

import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  BookOpen,
  Building2,
  CalendarRange,
  Contact2,
  LayoutDashboard,
  Layers,
  Palette,
  PlaySquare,
  School,
  UserCircle,
  UserPlus,
  Users,
} from 'lucide-react';
import type { Role } from '@/lib/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Nav items per role. SUPERADMIN and PRINCIPAL have APIs beyond auth/profile
 * today (theme management, school management); the other roles get a
 * Dashboard + Profile shell, ready to grow once their own APIs are wired up.
 */
export function getNavItems(role: Role): NavItem[] {
  const base = role.toLowerCase();
  const items: NavItem[] = [
    { label: 'Dashboard', href: `/${base}/dashboard`, icon: LayoutDashboard },
  ];

  if (role === 'SUPERADMIN') {
    items.push({ label: 'School Leads', href: '/superadmin/school-leads', icon: Contact2 });
    items.push({ label: 'Theme Settings', href: '/superadmin/settings/theme', icon: Palette });
  }

  if (role === 'PRINCIPAL') {
    items.push({ label: 'School', href: '/principal/school', icon: School });
    items.push({ label: 'Staff', href: '/principal/staff', icon: Users });
  }

  if (role === 'STAFF') {
    items.push({ label: 'School Infrastructure', href: '/staff/infrastructure', icon: Building2 });
    items.push({ label: 'Academic Year', href: '/staff/academic-year', icon: CalendarRange });
    items.push({ label: 'Class', href: '/staff/class', icon: BookOpen });
    items.push({ label: 'Class Section', href: '/staff/class-section', icon: Layers });
    items.push({ label: 'Student Admission', href: '/staff/student-admission', icon: UserPlus });
    items.push({ label: 'YouTube Testimonials', href: '/staff/youtube-testimonials', icon: PlaySquare });
    items.push({ label: 'Chatbot Management', href: '/staff/chatbot', icon: Bot });
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

import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  BookMarked,
  BookOpen,
  Building2,
  CalendarRange,
  ClipboardList,
  Contact2,
  IndianRupee,
  LayoutDashboard,
  Layers,
  NotebookPen,
  Palette,
  PlaySquare,
  School,
  UserCircle,
  UserCog,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';
import type { Role } from '@/lib/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Nav items per role. SUPERADMIN, PRINCIPAL, STAFF and TEACHER have APIs
 * beyond auth/profile today; STUDENT still gets a Dashboard + Profile shell,
 * ready to grow once its own APIs are wired up.
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
    items.push({ label: 'Exams', href: '/principal/exams', icon: ClipboardList });
    items.push({ label: 'Teacher Assignments', href: '/principal/teacher-section', icon: UserCog });
    items.push({ label: 'Fee Structure', href: '/principal/fee-structure', icon: IndianRupee });
  }

  if (role === 'STAFF') {
    items.push({ label: 'School Infrastructure', href: '/staff/infrastructure', icon: Building2 });
    items.push({ label: 'Academic Year', href: '/staff/academic-year', icon: CalendarRange });
    items.push({ label: 'Class', href: '/staff/class', icon: BookOpen });
    items.push({ label: 'Class Section', href: '/staff/class-section', icon: Layers });
    items.push({ label: 'Subject', href: '/staff/subject', icon: BookMarked });
    items.push({ label: 'Student Admission', href: '/staff/student-admission', icon: UserPlus });
    items.push({ label: 'Student Class Section', href: '/staff/student-class-section', icon: UsersRound });
    items.push({ label: 'Teacher Section', href: '/staff/teacher-section', icon: UserCog });
    items.push({ label: 'Exams', href: '/staff/exams', icon: ClipboardList });
    items.push({ label: 'Fee Structure', href: '/staff/fee-structure', icon: IndianRupee });
    items.push({ label: 'YouTube Testimonials', href: '/staff/youtube-testimonials', icon: PlaySquare });
    items.push({ label: 'Chatbot Management', href: '/staff/chatbot', icon: Bot });
  }

  if (role === 'TEACHER') {
    items.push({ label: 'Homework', href: '/teacher/homework', icon: NotebookPen });
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

import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bot,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Contact2,
  Globe,
  IndianRupee,
  LayoutDashboard,
  Layers,
  Library,
  Megaphone,
  MessageSquare,
  NotebookPen,
  Palette,
  ShieldCheck,
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
    items.push({ label: 'Staff', href: '/superadmin/staff', icon: Users });
  }

  // if (role === 'PRINCIPAL') {
  //   items.push({ label: 'School', href: '/principal/school', icon: School });
  //   items.push({ label: 'Staff', href: '/principal/staff', icon: Users });
  //   items.push({ label: 'Exams', href: '/principal/exams', icon: ClipboardList });
  //   items.push({ label: 'Teacher Assignments', href: '/principal/teacher-section', icon: UserCog });
  //   items.push({ label: 'Fee Structure', href: '/principal/fee-structure', icon: IndianRupee });
  // }

  if (role === 'ADMIN' || role === 'PRINCIPAL') {
    items.push({ label: 'Students', href: '/principal/student-admission', icon: UserPlus });
    items.push({ label: 'Teachers', href: '/principal/staff', icon: Users });
    items.push({ label: 'Classes', href: '/principal/class', icon: BookOpen });
    items.push({ label: 'Attedance', href: '/principal/attedance', icon: ClipboardCheck });
    items.push({ label: 'Fees', href: '/principal/fee-structure', icon: IndianRupee });
    items.push({ label: 'Time Table', href: '/principal/time-table', icon: CalendarClock });
    items.push({ label: 'Notice', href: '/principal/notice', icon: Megaphone });
    items.push({ label: 'Homework', href: '/principal/homework', icon: NotebookPen });
    items.push({ label: 'Communication', href: '/principal/communication', icon: MessageSquare });
    items.push({ label: 'Report', href: '/principal/report', icon: BarChart3 });
    items.push({ label: 'Role & Permission', href: '/principal/role-permission', icon: ShieldCheck });
    items.push({ label: 'Subject & Class', href: '/principal/subject-class', icon: Layers });
    items.push({ label: 'Test & Exam', href: '/principal/exams', icon: ClipboardList });
    items.push({ label: 'Study Material', href: '/principal/study-material', icon: Library });
    items.push({ label: 'Chatbot Management', href: '/principal/chatbot', icon: Bot });

    // items.push({ label: 'Subject', href: '/principal/subject', icon: BookMarked });
    
    // items.push({ label: 'Teacher Section', href: '/principal/teacher-section', icon: UserCog });

    
    items.push({ label: 'Website Settings', href: '/principal/website-setting', icon: Globe });
  }

  if (role === 'TEACHER') {
    items.push({ label: 'Attedance', href: '/teacher/attedance', icon: ClipboardCheck });
    items.push({ label: 'Homework', href: '/teacher/homework', icon: NotebookPen });
    items.push({ label: 'Holidays', href: '/teacher/holiday', icon: CalendarDays });
    items.push({ label: 'Communication', href: '/teacher/communication', icon: MessageSquare });
  }

  if (role === 'STUDENT') {
    items.push({ label: 'Communication', href: '/student/communication', icon: MessageSquare });
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
  ADMIN: "Admin",
};

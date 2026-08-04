import AppShell from '@/components/dashboard/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute role="TEACHER">
      <AppShell role="TEACHER">{children}</AppShell>
    </ProtectedRoute>
  );
}

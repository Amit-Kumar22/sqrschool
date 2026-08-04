import AppShell from '@/components/dashboard/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute role="STUDENT">
      <AppShell role="STUDENT">{children}</AppShell>
    </ProtectedRoute>
  );
}

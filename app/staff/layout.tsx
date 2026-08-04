import AppShell from '@/components/dashboard/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute role="STAFF">
      <AppShell role="STAFF">{children}</AppShell>
    </ProtectedRoute>
  );
}

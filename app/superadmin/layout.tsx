import AppShell from '@/components/dashboard/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute role="SUPERADMIN">
      <AppShell role="SUPERADMIN">{children}</AppShell>
    </ProtectedRoute>
  );
}

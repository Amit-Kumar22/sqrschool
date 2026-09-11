import AppShell from '@/components/dashboard/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute role="PARENT">
      <AppShell role="PARENT">{children}</AppShell>
    </ProtectedRoute>
  );
}

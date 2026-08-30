import AppShell from '@/components/dashboard/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PrincipalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute role="PRINCIPAL">
      <AppShell role="PRINCIPAL">{children}</AppShell>
    </ProtectedRoute>
  );
}

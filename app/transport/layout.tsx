import AppShell from '@/components/dashboard/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function TransportLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute role="TRANSPORT">
      <AppShell role="TRANSPORT">{children}</AppShell>
    </ProtectedRoute>
  );
}

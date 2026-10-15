'use client';

import SetPageTitle from '@/components/dashboard/SetPageTitle';
import TransportDashboardContent from '@/components/transport/TransportDashboardContent';

export default function TransportDashboardPage() {
  return (
    <>
      <SetPageTitle title="Transport Dashboard" />
      <TransportDashboardContent hrefFor={(section) => `/transport/${section}`} />
    </>
  );
}

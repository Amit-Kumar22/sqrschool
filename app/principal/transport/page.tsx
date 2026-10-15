import TransportHubContent from '@/components/transport/TransportHubContent';

export default async function PrincipalTransportPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <TransportHubContent initialTab={tab} />;
}

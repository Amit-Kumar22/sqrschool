import CollectFeePageContent from '@/components/fee/CollectFeePageContent';

export default async function PrincipalCollectFeePage({ params }: { params: Promise<{ feeId: string }> }) {
  const { feeId } = await params;
  return <CollectFeePageContent feeId={Number(feeId)} />;
}

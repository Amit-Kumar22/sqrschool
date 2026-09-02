import FeeManagementPageContent from '@/components/fee/FeeManagementPageContent';

export default async function StaffFeeStructurePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <FeeManagementPageContent initialTab={tab} />;
}

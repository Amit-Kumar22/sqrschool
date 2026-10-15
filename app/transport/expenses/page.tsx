import SetPageTitle from '@/components/dashboard/SetPageTitle';
import ExpensesTab from '@/components/transport/ExpensesTab';

export default function TransportExpensesPage() {
  return (
    <>
      <SetPageTitle title="Vehicle Expenses" />
      <ExpensesTab />
    </>
  );
}

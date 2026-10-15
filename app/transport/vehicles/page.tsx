import SetPageTitle from '@/components/dashboard/SetPageTitle';
import VehiclesTab from '@/components/transport/VehiclesTab';

export default function TransportVehiclesPage() {
  return (
    <>
      <SetPageTitle title="Vehicles" />
      <VehiclesTab />
    </>
  );
}

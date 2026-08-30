import { UserCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ProfileView from '@/components/profile/ProfileView';

export default function StaffProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader icon={UserCircle} title="My Profile" description="View and update your account details." />
      <ProfileView />
    </div>
  );
}

import SetPageTitle from '@/components/dashboard/SetPageTitle';
import ProfileView from '@/components/profile/ProfileView';

export default function StudentProfilePage() {
  return (
    <div className="space-y-6">
      <SetPageTitle title="My Profile" />
      <ProfileView />
    </div>
  );
}

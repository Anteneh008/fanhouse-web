import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardNav from '../components/DashboardNav';


export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'creator') {
    redirect('/become-creator');
  }

  return (
    <>
      <DashboardNav userRole="creator" />
      {children}
    </>
  );
}


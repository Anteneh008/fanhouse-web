import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardNav from '../components/DashboardNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  return (
    <>
      <DashboardNav userRole="admin" />
      {children}
    </>
  );
}


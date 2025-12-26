import { getCurrentUser } from '@/lib/auth';
import DashboardNav from '../components/DashboardNav';


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return null; // Will redirect via middleware
  }

  return (
    <>
      <DashboardNav userRole={user.role} />
      {children}
    </>
  );
}


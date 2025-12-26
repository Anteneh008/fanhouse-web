import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import CreatorManagement from './CreatorManagement';

export default async function AdminCreatorsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  // Fetch all creators
  const creatorsResult = await db.query(
    `SELECT 
      u.id,
      u.email,
      u.role,
      u.creator_status,
      u.created_at,
      cp.display_name,
      cp.bio,
      kyc.status as kyc_status,
      kyc.rejection_reason
    FROM users u
    LEFT JOIN creator_profiles cp ON u.id = cp.user_id
    LEFT JOIN kyc_verifications kyc ON u.id = kyc.user_id AND kyc.verification_type = 'kyc'
    WHERE u.role = 'creator'
    ORDER BY 
      CASE u.creator_status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
      END,
      u.created_at DESC`
  );

  const creators = creatorsResult.rows;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Creator Management</h1>
          <p className="mt-2 text-gray-600">
            Review and manage creator applications
          </p>
        </div>

        <CreatorManagement creators={creators} />
      </div>
    </div>
  );
}


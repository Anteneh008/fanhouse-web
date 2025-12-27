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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Creator Management
          </h1>
          <p className="text-white/80 text-lg font-medium">
            Review and manage creator applications
          </p>
        </div>

        <CreatorManagement creators={creators} />
      </div>
    </div>
  );
}


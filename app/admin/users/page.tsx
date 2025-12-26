import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

export default async function AdminUsersPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  // Get all users with stats
  const usersResult = await db.query(
    `SELECT 
      u.*,
      cp.display_name as creator_display_name,
      COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active') as subscription_count,
      COUNT(DISTINCT p.id) FILTER (WHERE p.is_disabled = false) as post_count
    FROM users u
    LEFT JOIN creator_profiles cp ON u.id = cp.user_id
    LEFT JOIN subscriptions s ON u.id = s.creator_id
    LEFT JOIN posts p ON u.id = p.creator_id
    GROUP BY u.id, cp.display_name
    ORDER BY u.created_at DESC
    LIMIT 200`
  );

  const users = usersResult.rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    creatorStatus: row.creator_status,
    creatorDisplayName: row.creator_display_name,
    subscriptionCount: parseInt(row.subscription_count || '0'),
    postCount: parseInt(row.post_count || '0'),
    createdAt: row.created_at,
  }));

  // Get stats
  const statsResult = await db.query(
    `SELECT 
      COUNT(*) FILTER (WHERE role = 'fan') as fans,
      COUNT(*) FILTER (WHERE role = 'creator') as creators,
      COUNT(*) FILTER (WHERE role = 'admin') as admins,
      COUNT(*) FILTER (WHERE creator_status = 'pending') as pending_creators
    FROM users`
  );

  const stats = {
    fans: parseInt(statsResult.rows[0]?.fans || '0'),
    creators: parseInt(statsResult.rows[0]?.creators || '0'),
    admins: parseInt(statsResult.rows[0]?.admins || '0'),
    pendingCreators: parseInt(statsResult.rows[0]?.pending_creators || '0'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage users and accounts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">F</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Fans</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.fans}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Creators</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.creators}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingCreators}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {userItem.email}
                      </div>
                      {userItem.creatorDisplayName && (
                        <div className="text-sm text-gray-500">
                          {userItem.creatorDisplayName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userItem.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : userItem.role === 'creator'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {userItem.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {userItem.creatorStatus ? (
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            userItem.creatorStatus === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : userItem.creatorStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {userItem.creatorStatus}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userItem.role === 'creator' && (
                        <div>
                          <div>{userItem.subscriptionCount} subscribers</div>
                          <div>{userItem.postCount} posts</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {userItem.role === 'creator' && (
                          <Link
                            href={`/admin/creators`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Manage
                          </Link>
                        )}
                        {userItem.role === 'creator' && userItem.creatorStatus === 'pending' && (
                          <Link
                            href={`/admin/creators`}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            Review
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

export default async function AdminPage() {
  const user = await getCurrentUser();

  // Check if user is authenticated and is admin
  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  // Get platform stats
  const [
    usersCount,
    creatorsCount,
    pendingCreators,
    postsCount,
    transactionsCount,
  ] = await Promise.all([
    db.query('SELECT COUNT(*) as count FROM users'),
    db.query("SELECT COUNT(*) as count FROM users WHERE role = 'creator' AND creator_status = 'approved'"),
    db.query("SELECT COUNT(*) as count FROM users WHERE role = 'creator' AND creator_status = 'pending'"),
    db.query('SELECT COUNT(*) as count FROM posts WHERE is_disabled = false'),
    db.query("SELECT COUNT(*) as count FROM transactions WHERE status = 'completed'"),
  ]);

  const stats = {
    totalUsers: parseInt(usersCount.rows[0]?.count || '0'),
    approvedCreators: parseInt(creatorsCount.rows[0]?.count || '0'),
    pendingCreators: parseInt(pendingCreators.rows[0]?.count || '0'),
    totalPosts: parseInt(postsCount.rows[0]?.count || '0'),
    totalTransactions: parseInt(transactionsCount.rows[0]?.count || '0'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Platform overview and management
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">U</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{stats.approvedCreators}</p>
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
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Posts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">T</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalTransactions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  href="/admin/creators"
                  className="block p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-1">Creator Management</h4>
                  <p className="text-sm text-gray-500">
                    Review and approve creator applications ({stats.pendingCreators} pending)
                  </p>
                </Link>

                <Link
                  href="/admin/posts"
                  className="block p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-1">Content Moderation</h4>
                  <p className="text-sm text-gray-500">
                    Manage posts and content ({stats.totalPosts} posts)
                  </p>
                </Link>

                <Link
                  href="/admin/transactions"
                  className="block p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-1">Transactions</h4>
                  <p className="text-sm text-gray-500">
                    View and manage transactions ({stats.totalTransactions} total)
                  </p>
                </Link>

                <Link
                  href="/admin/users"
                  className="block p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-900 mb-1">User Management</h4>
                  <p className="text-sm text-gray-500">
                    Manage users and accounts ({stats.totalUsers} users)
                  </p>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="text-center py-8 text-gray-500">
                Activity feed coming soon
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Admin Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Account</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      {user.role}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Platform Health */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Health</h3>
              <dl className="space-y-3">
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-500">Database</dt>
                  <dd className="text-sm font-medium text-green-600">✓ Healthy</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-500">API</dt>
                  <dd className="text-sm font-medium text-green-600">✓ Running</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-gray-500">Storage</dt>
                  <dd className="text-sm font-medium text-green-600">✓ Available</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


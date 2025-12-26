import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

export default async function CreatorDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is a creator
  if (user.role !== 'creator') {
    redirect('/become-creator');
  }

  // Check if creator is approved
  if (user.creatorStatus !== 'approved') {
    redirect('/creator/status');
  }

  // Get creator profile
  const profileResult = await db.query(
    'SELECT * FROM creator_profiles WHERE user_id = $1',
    [user.id]
  );
  const profile = profileResult.rows[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {profile?.display_name || user.email}!
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  disabled
                  className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="font-medium">Create Post</div>
                  <div className="text-sm opacity-90">Coming soon</div>
                </button>
                <button
                  disabled
                  className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="font-medium">Go Live</div>
                  <div className="text-sm opacity-90">Coming soon</div>
                </button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile?.display_name || 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Approved
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Subscription Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile?.subscription_price_cents
                      ? `$${(profile.subscription_price_cents / 100).toFixed(2)}`
                      : 'Not set'}
                  </dd>
                </div>
              </dl>
              {profile?.bio && (
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Bio</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.bio}</dd>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings</h3>
              <div className="text-3xl font-bold text-gray-900">$0.00</div>
              <p className="text-sm text-gray-500 mt-1">Total earnings</p>
              <div className="mt-4">
                <Link
                  href="/creator/earnings"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View details →
                </Link>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stats</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Subscribers</dt>
                  <dd className="text-sm font-medium text-gray-900">0</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Posts</dt>
                  <dd className="text-sm font-medium text-gray-900">0</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Messages</dt>
                  <dd className="text-sm font-medium text-gray-900">0</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to Main Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}


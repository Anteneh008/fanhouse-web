import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export default async function CreatorSubscribersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'creator') {
    redirect('/become-creator');
  }

  if (user.creatorStatus !== 'approved') {
    redirect('/creator/status');
  }

  // Get active subscriptions
  const subscriptionsResult = await db.query(
    `SELECT 
      s.*,
      u.email as fan_email,
      u.created_at as fan_joined_at
    FROM subscriptions s
    INNER JOIN users u ON s.fan_id = u.id
    WHERE s.creator_id = $1 AND s.status = 'active'
    ORDER BY s.started_at DESC`,
    [user.id]
  );

  const subscriptions = subscriptionsResult.rows.map((row) => ({
    id: row.id,
    fanId: row.fan_id,
    fanEmail: row.fan_email,
    fanJoinedAt: row.fan_joined_at,
    tierName: row.tier_name,
    priceCents: row.price_cents,
    status: row.status,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    autoRenew: row.auto_renew,
  }));

  // Get subscription stats
  const statsResult = await db.query(
    `SELECT 
      COUNT(*) as total,
      SUM(price_cents) as monthly_revenue_cents
    FROM subscriptions
    WHERE creator_id = $1 AND status = 'active'`,
    [user.id]
  );

  const stats = {
    total: parseInt(statsResult.rows[0]?.total || '0'),
    monthlyRevenueCents: parseInt(statsResult.rows[0]?.monthly_revenue_cents || '0'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscribers</h1>
          <p className="mt-2 text-gray-600">
            Manage your subscriber base
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">S</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Subscribers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(stats.monthlyRevenueCents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscribers List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Subscriptions</h2>

          {subscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscriber
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auto Renew
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {sub.fanEmail}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(sub.fanJoinedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {sub.tierName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sub.startedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sub.expiresAt
                          ? new Date(sub.expiresAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ${(sub.priceCents / 100).toFixed(2)}/mo
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {sub.autoRenew ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">No active subscribers yet</p>
              <p className="text-sm">
                Start creating content to attract subscribers
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Subscription Management
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Subscribers can access all subscriber-only content</li>
            <li>Auto-renew subscriptions continue until canceled</li>
            <li>Monthly revenue is calculated from active subscriptions</li>
            <li>Subscribers are charged automatically each month</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


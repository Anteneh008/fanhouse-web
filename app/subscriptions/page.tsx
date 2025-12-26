import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

export default async function SubscriptionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's subscriptions
  const subscriptionsResult = await db.query(
    `SELECT 
      s.*,
      u.email as creator_email,
      cp.display_name as creator_display_name,
      cp.profile_image_url as creator_avatar_url
    FROM subscriptions s
    INNER JOIN users u ON s.creator_id = u.id
    LEFT JOIN creator_profiles cp ON u.id = cp.user_id
    WHERE s.fan_id = $1
    ORDER BY 
      CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
      s.started_at DESC`,
    [user.id]
  );

  const subscriptions = subscriptionsResult.rows.map((row) => ({
    id: row.id,
    creatorId: row.creator_id,
    creatorEmail: row.creator_email,
    creatorDisplayName: row.creator_display_name,
    creatorAvatarUrl: row.creator_avatar_url,
    tierName: row.tier_name,
    priceCents: row.price_cents,
    status: row.status,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    autoRenew: row.auto_renew,
  }));

  // Calculate total monthly cost
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const totalMonthlyCost = activeSubscriptions.reduce(
    (sum, sub) => sum + (sub.priceCents || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Subscriptions</h1>
          <p className="mt-2 text-gray-600">
            Manage your creator subscriptions
          </p>
        </div>

        {/* Summary Card */}
        {activeSubscriptions.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Monthly Cost</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${(totalMonthlyCost / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {activeSubscriptions.length} active subscription
                  {activeSubscriptions.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500">Annual Cost</p>
                <p className="text-2xl font-semibold text-gray-700 mt-1">
                  ${((totalMonthlyCost * 12) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscriptions List */}
        {subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Creator Avatar */}
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {subscription.creatorAvatarUrl ? (
                          <img
                            src={subscription.creatorAvatarUrl}
                            alt={subscription.creatorDisplayName || subscription.creatorEmail}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-gray-600">
                            {(subscription.creatorDisplayName || subscription.creatorEmail)[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Creator Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {subscription.creatorDisplayName || subscription.creatorEmail}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              subscription.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : subscription.status === 'canceled'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {subscription.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <span>Tier: {subscription.tierName}</span>
                            <span>
                              ${(subscription.priceCents / 100).toFixed(2)}/month
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span>
                              Started: {new Date(subscription.startedAt).toLocaleDateString()}
                            </span>
                            {subscription.expiresAt && (
                              <span>
                                {subscription.status === 'active'
                                  ? `Renews: ${new Date(subscription.expiresAt).toLocaleDateString()}`
                                  : `Expired: ${new Date(subscription.expiresAt).toLocaleDateString()}`}
                              </span>
                            )}
                          </div>
                          <div>
                            <span>
                              Auto-renew: {subscription.autoRenew ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col space-y-2 shrink-0">
                      <Link
                        href={`/creators/${subscription.creatorId}`}
                        className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 text-center font-medium text-sm"
                      >
                        View Profile
                      </Link>
                      {subscription.status === 'active' && (
                        <Link
                          href={`/subscriptions/${subscription.id}/cancel`}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-center font-medium text-sm"
                        >
                          Cancel
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No subscriptions yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start subscribing to creators to access exclusive content
            </p>
            <Link
              href="/creators"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Discover Creators
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


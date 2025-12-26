import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

export default async function CreatorsPage() {
  const user = await getCurrentUser();

  // Get all approved creators with their profiles
  const creatorsResult = await db.query(
    `SELECT 
      u.id,
      u.email,
      u.created_at,
      cp.display_name,
      cp.bio,
      cp.subscription_price_cents,
      cp.profile_image_url as avatar_url,
      COUNT(DISTINCT s.id) as subscriber_count,
      COUNT(DISTINCT p.id) as post_count
    FROM users u
    INNER JOIN creator_profiles cp ON u.id = cp.user_id
    LEFT JOIN subscriptions s ON u.id = s.creator_id AND s.status = 'active'
    LEFT JOIN posts p ON u.id = p.creator_id AND p.is_disabled = false
    WHERE u.role = 'creator' AND u.creator_status = 'approved'
    GROUP BY u.id, u.email, u.created_at, cp.display_name, cp.bio, cp.subscription_price_cents, cp.profile_image_url
    ORDER BY subscriber_count DESC, u.created_at DESC`
  );

  const creators = creatorsResult.rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    bio: row.bio,
    subscriptionPriceCents: row.subscription_price_cents,
    avatarUrl: row.avatar_url,
    subscriberCount: parseInt(row.subscriber_count || '0'),
    postCount: parseInt(row.post_count || '0'),
    createdAt: row.created_at,
  }));

  // Check if user is subscribed to any creators
  let userSubscriptions: Set<string> = new Set();
  if (user) {
    const subscriptionsResult = await db.query(
      'SELECT creator_id FROM subscriptions WHERE fan_id = $1 AND status = $2',
      [user.id, 'active']
    );
    userSubscriptions = new Set(
      subscriptionsResult.rows.map((row) => row.creator_id)
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Discover Creators</h1>
          <p className="mt-2 text-gray-600">
            Browse and subscribe to your favorite creators
          </p>
        </div>

        {/* Creators Grid */}
        {creators.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => {
              const isSubscribed = userSubscriptions.has(creator.id);

              return (
                <div
                  key={creator.id}
                  className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Creator Header */}
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                        {creator.avatarUrl ? (
                          <img
                            src={creator.avatarUrl}
                            alt={creator.displayName || creator.email}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-gray-600">
                            {(creator.displayName || creator.email)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {creator.displayName || creator.email}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {creator.subscriberCount} subscribers
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    {creator.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {creator.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{creator.postCount} posts</span>
                      {creator.subscriptionPriceCents && (
                        <span className="font-medium text-gray-900">
                          ${(creator.subscriptionPriceCents / 100).toFixed(2)}/month
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Link
                        href={`/creators/${creator.id}`}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 text-center font-medium text-sm"
                      >
                        View Profile
                      </Link>
                      {isSubscribed ? (
                        <span className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-md text-center font-medium text-sm">
                          Subscribed
                        </span>
                      ) : (
                        <Link
                          href={`/creators/${creator.id}/subscribe`}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center font-medium text-sm"
                        >
                          Subscribe
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No creators yet
            </h3>
            <p className="text-gray-500 mb-6">
              Creators will appear here once they&apos;re approved
            </p>
            {user && user.role !== 'creator' && (
              <Link
                href="/become-creator"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Become a Creator
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


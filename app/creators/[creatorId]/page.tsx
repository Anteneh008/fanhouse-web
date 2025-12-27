import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';
import MessageButton from '@/app/components/MessageButton';

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const user = await getCurrentUser();
  const { creatorId } = await params;

  // Get creator profile
  const creatorResult = await db.query(
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
    WHERE u.id = $1 AND u.role = 'creator' AND u.creator_status = 'approved'
    GROUP BY u.id, u.email, u.created_at, cp.display_name, cp.bio, cp.subscription_price_cents, cp.profile_image_url`,
    [creatorId]
  );

  if (creatorResult.rows.length === 0) {
    redirect('/creators');
  }

  const creator = {
    id: creatorResult.rows[0].id,
    email: creatorResult.rows[0].email,
    displayName: creatorResult.rows[0].display_name,
    bio: creatorResult.rows[0].bio,
    subscriptionPriceCents: creatorResult.rows[0].subscription_price_cents,
    avatarUrl: creatorResult.rows[0].avatar_url,
    subscriberCount: parseInt(creatorResult.rows[0].subscriber_count || '0'),
    postCount: parseInt(creatorResult.rows[0].post_count || '0'),
    createdAt: creatorResult.rows[0].created_at,
  };

  // Check if user is subscribed
  let isSubscribed = false;
  if (user) {
    const subscriptionResult = await db.query(
      'SELECT id FROM subscriptions WHERE fan_id = $1 AND creator_id = $2 AND status = $3',
      [user.id, creatorId, 'active']
    );
    isSubscribed = subscriptionResult.rows.length > 0;
  }

  // Get recent posts (public preview)
  const postsResult = await db.query(
    `SELECT 
      p.*,
      COUNT(DISTINCT m.id) as media_count
    FROM posts p
    LEFT JOIN media_assets m ON p.id = m.post_id
    WHERE p.creator_id = $1 AND p.is_disabled = false
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT 6`,
    [creatorId]
  );

  const posts = postsResult.rows.map((row) => ({
    id: row.id,
    content: row.content,
    visibilityType: row.visibility_type,
    priceCents: row.price_cents,
    createdAt: row.created_at,
    mediaCount: parseInt(row.media_count || '0'),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Creator Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden shrink-0">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName || creator.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-gray-600">
                  {(creator.displayName || creator.email)[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {creator.displayName || creator.email}
              </h1>
              {creator.bio && (
                <p className="text-gray-600 mb-4">{creator.bio}</p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>{creator.subscriberCount} subscribers</span>
                <span>{creator.postCount} posts</span>
                {creator.subscriptionPriceCents && (
                  <span className="font-medium text-gray-900">
                    ${(creator.subscriptionPriceCents / 100).toFixed(2)}/month
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 flex flex-col space-y-2">
              {isSubscribed ? (
                <span className="px-6 py-3 bg-green-100 text-green-800 rounded-md font-medium text-center">
                  Subscribed
                </span>
              ) : (
                <Link
                  href={`/creators/${creatorId}/subscribe`}
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-center"
                >
                  Subscribe
                </Link>
              )}
              {user && user.role === 'fan' && (
                <MessageButton
                  creatorId={creatorId}
                  className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                />
              )}
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Posts
          </h2>
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border-b border-gray-200 pb-4 last:border-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {post.content && (
                        <p className="text-gray-900 line-clamp-2 mb-2">
                          {post.content}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className="capitalize">{post.visibilityType}</span>
                        {post.visibilityType === 'ppv' && (
                          <span>${(post.priceCents / 100).toFixed(2)}</span>
                        )}
                        <span>{post.mediaCount} media</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Link
                      href={`/posts/${post.id}`}
                      className="ml-4 text-sm text-blue-600 hover:text-blue-700"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No posts yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


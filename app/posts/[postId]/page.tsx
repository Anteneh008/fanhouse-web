import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';
import { hasPostAccess } from '@/lib/entitlements';

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const user = await getCurrentUser();
  const { postId } = await params;

  // Get post with creator info and media
  const postResult = await db.query(
    `SELECT 
      p.*,
      u.id as creator_id,
      u.email as creator_email,
      cp.display_name as creator_display_name,
      cp.profile_image_url as creator_avatar_url,
      COALESCE(
        json_agg(
          json_build_object(
            'id', m.id,
            'fileUrl', m.file_url,
            'fileType', m.file_type,
            'thumbnailUrl', m.thumbnail_url,
            'sortOrder', m.sort_order
          ) ORDER BY m.sort_order
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'
      ) as media
    FROM posts p
    INNER JOIN users u ON p.creator_id = u.id
    LEFT JOIN creator_profiles cp ON u.id = cp.user_id
    LEFT JOIN media_assets m ON p.id = m.post_id
    WHERE p.id = $1 AND p.is_disabled = false
    GROUP BY p.id, u.id, u.email, cp.display_name, cp.profile_image_url`,
    [postId]
  );

  if (postResult.rows.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">This post doesn't exist or has been removed.</p>
          <Link
            href="/feed"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const row = postResult.rows[0];
  const post = {
    id: row.id,
    creatorId: row.creator_id,
    creatorEmail: row.creator_email,
    creatorDisplayName: row.creator_display_name,
    creatorAvatarUrl: row.creator_avatar_url,
    content: row.content,
    visibilityType: row.visibility_type,
    priceCents: row.price_cents,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    createdAt: row.created_at,
    media: row.media || [],
  };

  // Check if user has access
  let hasAccess = false;
  if (user) {
    hasAccess = await hasPostAccess(user.id, postId);
  } else {
    // Non-authenticated users can only see free posts
    hasAccess = post.visibilityType === 'free';
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/feed"
            className="text-blue-600 hover:text-blue-500 font-medium mb-4 inline-block"
          >
            ← Back to Feed
          </Link>
        </div>

        {/* Post Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Creator Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                {post.creatorAvatarUrl ? (
                  <img
                    src={post.creatorAvatarUrl}
                    alt={post.creatorDisplayName || post.creatorEmail}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-gray-600">
                    {(post.creatorDisplayName || post.creatorEmail)[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {post.creatorDisplayName || post.creatorEmail}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  post.visibilityType === 'free'
                    ? 'bg-green-100 text-green-800'
                    : post.visibilityType === 'subscriber'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                {post.visibilityType === 'ppv'
                  ? `PPV $${(post.priceCents / 100).toFixed(2)}`
                  : post.visibilityType}
              </span>
            </div>
          </div>

          {/* Post Content */}
          {hasAccess ? (
            <>
              {post.content && (
                <div className="p-6">
                  <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                </div>
              )}

              {/* Media */}
              {post.media.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 gap-4">
                    {post.media.map((media: any) => (
                      <div key={media.id} className="relative">
                        {media.fileType === 'image' ? (
                          <img
                            src={media.fileUrl}
                            alt="Post media"
                            className="w-full h-auto rounded-lg"
                          />
                        ) : (
                          <div className="w-full bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                            <span className="text-gray-500">Video</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="px-6 pb-4 flex items-center space-x-4 text-sm text-gray-500">
                <button className="hover:text-gray-700">
                  ❤️ {post.likesCount}
                </button>
                <button className="hover:text-gray-700">
                  💬 {post.commentsCount}
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto">
                {post.media.length > 0 && post.media[0].thumbnailUrl && (
                  <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden mb-4">
                    <img
                      src={post.media[0].thumbnailUrl}
                      alt="Locked content"
                      className="w-full h-full object-cover blur-sm"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-white text-center">
                        <svg
                          className="mx-auto h-12 w-12 mb-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <p className="font-medium">Locked Content</p>
                      </div>
                    </div>
                  </div>
                )}
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {post.visibilityType === 'ppv'
                    ? `Unlock this post for $${(post.priceCents / 100).toFixed(2)}`
                    : post.visibilityType === 'subscriber'
                    ? 'Subscribe to view this content'
                    : 'This content is locked'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {post.visibilityType === 'ppv'
                    ? 'Purchase to unlock and view this exclusive content'
                    : 'Subscribe to this creator to access subscriber-only content'}
                </p>
                {!user && (
                  <Link
                    href="/login"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium mb-4"
                  >
                    Login to Unlock
                  </Link>
                )}
                {user && post.visibilityType === 'ppv' && (
                  <form action={`/api/posts/${postId}/unlock`} method="POST">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                    >
                      Unlock for ${(post.priceCents / 100).toFixed(2)}
                    </button>
                  </form>
                )}
                {user && post.visibilityType === 'subscriber' && (
                  <Link
                    href={`/creators/${post.creatorId}/subscribe`}
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    Subscribe to View
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


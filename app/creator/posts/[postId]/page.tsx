import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

export default async function CreatorPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'creator') {
    redirect('/become-creator');
  }

  const { postId } = await params;

  // Get post with media
  const postResult = await db.query(
    `SELECT 
      p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', m.id,
            'fileUrl', m.file_url,
            'fileType', m.file_type,
            'thumbnailUrl', m.thumbnail_url,
            'sortOrder', m.sort_order,
            'fileSize', m.file_size,
            'mimeType', m.mime_type
          ) ORDER BY m.sort_order
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'
      ) as media
    FROM posts p
    LEFT JOIN media_assets m ON p.id = m.post_id
    WHERE p.id = $1 AND p.creator_id = $2
    GROUP BY p.id`,
    [postId, user.id]
  );

  if (postResult.rows.length === 0) {
    redirect('/creator/posts');
  }

  const post = {
    id: postResult.rows[0].id,
    content: postResult.rows[0].content,
    visibilityType: postResult.rows[0].visibility_type,
    priceCents: postResult.rows[0].price_cents,
    isPinned: postResult.rows[0].is_pinned,
    isDisabled: postResult.rows[0].is_disabled,
    likesCount: postResult.rows[0].likes_count,
    commentsCount: postResult.rows[0].comments_count,
    createdAt: postResult.rows[0].created_at,
    updatedAt: postResult.rows[0].updated_at,
    media: postResult.rows[0].media || [],
  };

  // Get unlock count for PPV posts
  let unlockCount = 0;
  if (post.visibilityType === 'ppv') {
    const unlockResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM entitlements 
       WHERE post_id = $1 AND entitlement_type = 'ppv_purchase'`,
      [postId]
    );
    unlockCount = parseInt(unlockResult.rows[0]?.count || '0');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Post Details</h1>
              <p className="mt-2 text-gray-600">
                View and manage your post
              </p>
            </div>
            <Link
              href="/creator/posts"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              ← Back to Posts
            </Link>
          </div>
        </div>

        {/* Post Card */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          {/* Post Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
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
                {post.isPinned && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                    Pinned
                  </span>
                )}
                {post.isDisabled && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                    Disabled
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(post.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Post Content */}
            {post.content && (
              <div className="mt-4">
                <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
              </div>
            )}
          </div>

          {/* Media */}
          {post.media.length > 0 && (
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Media ({post.media.length})
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {post.media.map((media: any) => (
                  <div key={media.id} className="relative">
                    {media.fileType === 'image' ? (
                      <img
                        src={media.fileUrl}
                        alt="Post media"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">Video</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post Stats */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">Likes</p>
                <p className="text-lg font-semibold text-gray-900">{post.likesCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Comments</p>
                <p className="text-lg font-semibold text-gray-900">{post.commentsCount}</p>
              </div>
              {post.visibilityType === 'ppv' && (
                <div>
                  <p className="text-sm text-gray-500">Unlocks</p>
                  <p className="text-lg font-semibold text-gray-900">{unlockCount}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Media</p>
                <p className="text-lg font-semibold text-gray-900">{post.media.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
          <div className="flex space-x-3">
            <Link
              href={`/creator/posts/${postId}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Edit Post
            </Link>
            <Link
              href={`/posts/${postId}`}
              className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 font-medium"
            >
              View as Fan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


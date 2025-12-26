import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

export default async function CreatorPostsPage() {
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

  // Get all posts with media
  const postsResult = await db.query(
    `SELECT 
      p.*,
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
    LEFT JOIN media_assets m ON p.id = m.post_id
    WHERE p.creator_id = $1
    GROUP BY p.id
    ORDER BY p.created_at DESC`,
    [user.id]
  );

  const posts = postsResult.rows.map((row) => ({
    id: row.id,
    content: row.content,
    visibilityType: row.visibility_type,
    priceCents: row.price_cents,
    isPinned: row.is_pinned,
    isDisabled: row.is_disabled,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    media: row.media || [],
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Posts</h1>
            <p className="mt-2 text-gray-600">
              Manage your content and posts
            </p>
          </div>
          <Link
            href="/creator/posts/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Create New Post
          </Link>
        </div>

        {/* Posts List */}
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {post.content ? (
                          <span className="line-clamp-2">{post.content}</span>
                        ) : (
                          <span className="text-gray-400 italic">No content</span>
                        )}
                      </h3>
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

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <span className="capitalize font-medium">{post.visibilityType}</span>
                      {post.visibilityType === 'ppv' && (
                        <span>${(post.priceCents / 100).toFixed(2)}</span>
                      )}
                      <span>{post.media.length} media</span>
                      <span>{post.likesCount} likes</span>
                      <span>{post.commentsCount} comments</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Media Preview */}
                    {post.media.length > 0 && (
                      <div className="mt-4 flex space-x-2">
                        {post.media.slice(0, 3).map((media: any) => (
                          <div
                            key={media.id}
                            className="w-20 h-20 bg-gray-200 rounded overflow-hidden"
                          >
                            {media.fileType === 'image' ? (
                              <img
                                src={media.fileUrl}
                                alt="Post media"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                <span className="text-xs text-gray-600">Video</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {post.media.length > 3 && (
                          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-600">
                              +{post.media.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex space-x-2">
                    <Link
                      href={`/creator/posts/${post.id}`}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View
                    </Link>
                    <Link
                      href={`/creator/posts/${post.id}/edit`}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No posts yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start creating content to engage with your fans
              </p>
              <Link
                href="/creator/posts/new"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Create Your First Post
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


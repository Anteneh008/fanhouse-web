import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

export default async function AdminPostsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  // Get all posts with creator info
  const postsResult = await db.query(
    `SELECT 
      p.*,
      u.email as creator_email,
      cp.display_name as creator_display_name,
      COUNT(DISTINCT m.id) as media_count,
      COUNT(DISTINCT e.id) as unlock_count
    FROM posts p
    INNER JOIN users u ON p.creator_id = u.id
    LEFT JOIN creator_profiles cp ON u.id = cp.user_id
    LEFT JOIN media_assets m ON p.id = m.post_id
    LEFT JOIN entitlements e ON p.id = e.post_id
    GROUP BY p.id, u.email, cp.display_name
    ORDER BY p.created_at DESC
    LIMIT 100`
  );

  const posts = postsResult.rows.map((row) => ({
    id: row.id,
    creatorId: row.creator_id,
    creatorEmail: row.creator_email,
    creatorDisplayName: row.creator_display_name,
    content: row.content,
    visibilityType: row.visibility_type,
    priceCents: row.price_cents,
    isPinned: row.is_pinned,
    isDisabled: row.is_disabled,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    mediaCount: parseInt(row.media_count || '0'),
    unlockCount: parseInt(row.unlock_count || '0'),
    createdAt: row.created_at,
  }));

  // Get stats
  const statsResult = await db.query(
    `SELECT 
      COUNT(*) FILTER (WHERE is_disabled = false) as active_posts,
      COUNT(*) FILTER (WHERE is_disabled = true) as disabled_posts,
      COUNT(*) FILTER (WHERE visibility_type = 'ppv') as ppv_posts
    FROM posts`
  );

  const stats = {
    activePosts: parseInt(statsResult.rows[0]?.active_posts || '0'),
    disabledPosts: parseInt(statsResult.rows[0]?.disabled_posts || '0'),
    ppvPosts: parseInt(statsResult.rows[0]?.ppv_posts || '0'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
          <p className="mt-2 text-gray-600">
            Review and manage platform content
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Posts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activePosts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">D</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Disabled Posts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.disabledPosts}</p>
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
                <p className="text-sm font-medium text-gray-500">PPV Posts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.ppvPosts}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {post.creatorDisplayName || post.creatorEmail}
                      </div>
                      <div className="text-sm text-gray-500">
                        {post.creatorEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {post.content || 'No content'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {post.mediaCount} media
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{post.likesCount} likes</div>
                      <div>{post.commentsCount} comments</div>
                      {post.visibilityType === 'ppv' && (
                        <div>{post.unlockCount} unlocks</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {post.isDisabled ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Disabled
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/posts/${post.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        {post.isDisabled ? (
                          <form
                            action={`/api/admin/posts/${post.id}/enable`}
                            method="POST"
                            className="inline"
                          >
                            <button
                              type="submit"
                              className="text-green-600 hover:text-green-900"
                            >
                              Enable
                            </button>
                          </form>
                        ) : (
                          <form
                            action={`/api/admin/posts/${post.id}/disable`}
                            method="POST"
                            className="inline"
                          >
                            <button
                              type="submit"
                              className="text-red-600 hover:text-red-900"
                            >
                              Disable
                            </button>
                          </form>
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


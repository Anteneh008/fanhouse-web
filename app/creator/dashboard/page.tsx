import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import { getCreatorEarnings } from "@/lib/ledger";

export default async function CreatorDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is a creator
  if (user.role !== "creator") {
    redirect("/become-creator");
  }

  // Check if creator is approved
  if (user.creatorStatus !== "approved") {
    redirect("/creator/status");
  }

  // Get creator profile
  const profileResult = await db.query(
    "SELECT * FROM creator_profiles WHERE user_id = $1",
    [user.id]
  );
  const profile = profileResult.rows[0];

  // Get earnings
  const earnings = await getCreatorEarnings(user.id);

  // Get stats
  const [postsCount, subscribersCount, mediaCount] = await Promise.all([
    db.query(
      "SELECT COUNT(*) as count FROM posts WHERE creator_id = $1 AND is_disabled = false",
      [user.id]
    ),
    db.query(
      "SELECT COUNT(*) as count FROM subscriptions WHERE creator_id = $1 AND status = $2",
      [user.id, "active"]
    ),
    db.query(
      "SELECT COUNT(*) as count FROM media_assets ma INNER JOIN posts p ON ma.post_id = p.id WHERE p.creator_id = $1",
      [user.id]
    ),
  ]);

  const stats = {
    posts: parseInt(postsCount.rows[0]?.count || "0"),
    subscribers: parseInt(subscribersCount.rows[0]?.count || "0"),
    media: parseInt(mediaCount.rows[0]?.count || "0"),
  };

  // Get recent posts
  const recentPostsResult = await db.query(
    `SELECT p.*, COUNT(m.id) as media_count
     FROM posts p
     LEFT JOIN media_assets m ON p.id = m.post_id
     WHERE p.creator_id = $1 AND p.is_disabled = false
     GROUP BY p.id
     ORDER BY p.created_at DESC
     LIMIT 5`,
    [user.id]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Creator Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {profile?.display_name || user.email}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Earnings
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(earnings.totalEarningsCents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(earnings.pendingEarningsCents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">S</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Subscribers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.subscribers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Posts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.posts}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/creator/posts/new"
                  className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center font-medium"
                >
                  Create Post
                </Link>
                <Link
                  href="/creator/posts"
                  className="px-4 py-3 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 text-center font-medium"
                >
                  Manage Posts
                </Link>
                <Link
                  href="/creator/verify"
                  className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center font-medium"
                >
                  Verify Identity
                </Link>
                <button
                  disabled
                  className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-center font-medium"
                >
                  Go Live
                  <div className="text-xs opacity-75 mt-1">Coming soon</div>
                </button>
                <Link
                  href="/creator/earnings"
                  className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center font-medium"
                >
                  View Earnings
                </Link>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Posts
                </h2>
                <Link
                  href="/creator/posts"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  View All →
                </Link>
              </div>
              {recentPostsResult.rows.length > 0 ? (
                <div className="space-y-4">
                  {recentPostsResult.rows.map(
                    (post: {
                      id: string;
                      content: string | null;
                      visibility_type: string;
                      media_count: string;
                      created_at: Date;
                    }) => (
                      <div
                        key={post.id}
                        className="border-b border-gray-200 pb-4 last:border-0"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 line-clamp-2">
                              {post.content || "No content"}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span className="capitalize">
                                {post.visibility_type}
                              </span>
                              <span>{post.media_count} media</span>
                              <span>
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/creator/posts/${post.id}`}
                            className="ml-4 text-sm text-blue-600 hover:text-blue-500"
                          >
                            View →
                          </Link>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">No posts yet</p>
                  <Link
                    href="/creator/posts/new"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Your First Post
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Profile
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Display Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile?.display_name || "Not set"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Approved
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Subscription Price
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile?.subscription_price_cents
                      ? `$${(profile.subscription_price_cents / 100).toFixed(
                          2
                        )}/month`
                      : "Not set"}
                  </dd>
                </div>
              </dl>
              <Link
                href="/creator/profile"
                className="mt-4 block text-sm text-blue-600 hover:text-blue-500"
              >
                Edit Profile →
              </Link>
            </div>

            {/* Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stats</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Total Posts</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {stats.posts}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Active Subscribers</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {stats.subscribers}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Media Files</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {stats.media}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Earnings Summary */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Earnings
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Total Earned</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(earnings.totalEarningsCents / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-lg font-semibold text-gray-700">
                    ${(earnings.pendingEarningsCents / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paid Out</p>
                  <p className="text-lg font-semibold text-gray-700">
                    ${(earnings.totalPayoutsCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              <Link
                href="/creator/earnings"
                className="mt-4 block text-sm text-blue-600 hover:text-blue-500"
              >
                View Details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Creator Dashboard
          </h1>
          <p className="text-white/80 text-lg">
            Welcome back, {profile?.display_name || user.email}! 👋
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/70">
                  Total Earnings
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(earnings.totalEarningsCents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/70">Pending</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(earnings.pendingEarningsCents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/70">Subscribers</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.subscribers}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/70">Posts</p>
                <p className="text-2xl font-bold text-white mt-1">
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
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <svg
                  className="w-6 h-6 text-pink-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Quick Actions</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/creator/posts/new"
                  className="px-4 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 text-center font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  ✨ Create Post
                </Link>
                <Link
                  href="/creator/posts"
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-center font-semibold border border-white/20 transition-all duration-300"
                >
                  📝 Manage Posts
                </Link>
                <Link
                  href="/creator/verify"
                  className="px-4 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 text-center font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  🔐 Verify Identity
                </Link>
                <Link
                  href="/creator/streams"
                  className="px-4 py-3 bg-linear-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 text-center font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  🎥 Go Live
                </Link>
                <Link
                  href="/creator/earnings"
                  className="px-4 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 text-center font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  💰 View Earnings
                </Link>
              </div>
            </div>

            {/* Recent Posts */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <svg
                    className="w-6 h-6 text-pink-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Recent Posts</span>
                </h2>
                <Link
                  href="/creator/posts"
                  className="text-sm text-white/80 hover:text-white font-medium flex items-center space-x-1 transition-colors"
                >
                  <span>View All</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
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
                        className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/90 line-clamp-2 mb-3">
                              {post.content || "No content"}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <span
                                className={`px-2.5 py-1 rounded-full font-semibold ${
                                  post.visibility_type === "free"
                                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                    : post.visibility_type === "subscriber"
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                    : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                }`}
                              >
                                {post.visibility_type === "ppv"
                                  ? "🔒 PPV"
                                  : post.visibility_type === "subscriber"
                                  ? "⭐ Subscriber"
                                  : "🆓 Free"}
                              </span>
                              <div className="flex items-center space-x-1 text-white/60">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>{post.media_count} media</span>
                              </div>
                              <div className="flex items-center space-x-1 text-white/60">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>
                                  {new Date(post.created_at).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Link
                            href={`/creator/posts/${post.id}`}
                            className="ml-4 shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all duration-300"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-white/40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-white/70 mb-4 font-medium">No posts yet</p>
                  <Link
                    href="/creator/posts/new"
                    className="inline-block px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-pink-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Profile</span>
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-white/70">
                    Display Name
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-white">
                    {profile?.display_name || "Not set"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-white/70">Status</dt>
                  <dd className="mt-1">
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold border border-green-500/30">
                      ✓ Approved
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-white/70">
                    Subscription Price
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-white">
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
                className="mt-6 flex text-sm text-white/80 hover:text-white font-medium items-center space-x-1 transition-colors"
              >
                <span>Edit Profile</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            {/* Stats */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Stats</span>
              </h3>
              <dl className="space-y-4">
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-white/70">Total Posts</dt>
                  <dd className="text-lg font-bold text-white">
                    {stats.posts}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-white/70">Active Subscribers</dt>
                  <dd className="text-lg font-bold text-white">
                    {stats.subscribers}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-sm text-white/70">Media Files</dt>
                  <dd className="text-lg font-bold text-white">
                    {stats.media}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Earnings Summary */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Earnings</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-white/70">Total Earned</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    ${(earnings.totalEarningsCents / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/70">Pending</p>
                  <p className="text-lg font-semibold text-white/90 mt-1">
                    ${(earnings.pendingEarningsCents / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/70">Paid Out</p>
                  <p className="text-lg font-semibold text-white/90 mt-1">
                    ${(earnings.totalPayoutsCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              <Link
                href="/creator/earnings"
                className="mt-6 flex text-sm text-white/80 hover:text-white font-medium items-center space-x-1 transition-colors"
              >
                <span>View Details</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

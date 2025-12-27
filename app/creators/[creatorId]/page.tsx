import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import MessageButton from "@/app/components/MessageButton";
import AuthNav from "@/app/components/AuthNav";

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
    redirect("/creators");
  }

  const creator = {
    id: creatorResult.rows[0].id,
    email: creatorResult.rows[0].email,
    displayName: creatorResult.rows[0].display_name,
    bio: creatorResult.rows[0].bio,
    subscriptionPriceCents: creatorResult.rows[0].subscription_price_cents,
    avatarUrl: creatorResult.rows[0].avatar_url,
    subscriberCount: parseInt(creatorResult.rows[0].subscriber_count || "0"),
    postCount: parseInt(creatorResult.rows[0].post_count || "0"),
    createdAt: creatorResult.rows[0].created_at,
  };

  // Check if user is subscribed
  let isSubscribed = false;
  if (user) {
    const subscriptionResult = await db.query(
      "SELECT id FROM subscriptions WHERE fan_id = $1 AND creator_id = $2 AND status = $3",
      [user.id, creatorId, "active"]
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
    mediaCount: parseInt(row.media_count || "0"),
  }));

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <AuthNav user={user} />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Creator Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 shadow-xl border border-white/20">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar with gradient ring */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 rounded-full p-1 bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500">
                <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden relative">
                  {creator.avatarUrl ? (
                    <Image
                      src={creator.avatarUrl}
                      alt={creator.displayName || creator.email}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-5xl font-bold text-white">
                      {(creator.displayName || creator.email)[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {creator.displayName || creator.email}
              </h1>
              {creator.bio && (
                <p className="text-white/80 mb-6 text-lg leading-relaxed">
                  {creator.bio}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center space-x-2 text-white/90">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="font-semibold">
                    {creator.subscriberCount} subscribers
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-white/90">
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-semibold">
                    {creator.postCount} posts
                  </span>
                </div>
                {creator.subscriptionPriceCents && (
                  <div className="flex items-center space-x-2 text-white/90">
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
                    <span className="font-bold text-lg">
                      ${(creator.subscriptionPriceCents / 100).toFixed(2)}/month
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col space-y-3 w-full md:w-auto">
              {isSubscribed ? (
                <span className="px-8 py-3 bg-green-500/20 backdrop-blur-sm text-green-300 rounded-xl font-semibold text-center border border-green-500/30">
                  ✓ Subscribed
                </span>
              ) : (
                <Link
                  href={`/creators/${creatorId}/subscribe`}
                  className="inline-block px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Subscribe Now
                </Link>
              )}
              {user && user.role === "fan" && (
                <MessageButton
                  creatorId={creatorId}
                  className="px-8 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                />
              )}
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
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
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {post.content && (
                        <p className="text-white/90 line-clamp-2 mb-3 leading-relaxed">
                          {post.content}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span
                          className={`px-2.5 py-1 rounded-full font-semibold ${
                            post.visibilityType === "free"
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : post.visibilityType === "subscriber"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          }`}
                        >
                          {post.visibilityType === "ppv"
                            ? `🔒 PPV $${(post.priceCents / 100).toFixed(2)}`
                            : post.visibilityType === "subscriber"
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
                          <span>{post.mediaCount} media</span>
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
                            {new Date(post.createdAt).toLocaleDateString(
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
                      href={`/posts/${post.id}`}
                      className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-300 flex items-center space-x-1"
                    >
                      <span>View</span>
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
              ))}
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
              <p className="text-white/70 text-lg font-medium">No posts yet</p>
              <p className="text-white/50 text-sm mt-2">
                Check back soon for new content!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

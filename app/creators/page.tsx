import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import MessageButton from "@/app/components/MessageButton";
import AuthNav from "@/app/components/AuthNav";

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
    subscriberCount: parseInt(row.subscriber_count || "0"),
    postCount: parseInt(row.post_count || "0"),
    createdAt: row.created_at,
  }));

  // Check if user is subscribed to any creators
  let userSubscriptions: Set<string> = new Set();
  if (user) {
    const subscriptionsResult = await db.query(
      "SELECT creator_id FROM subscriptions WHERE fan_id = $1 AND status = $2",
      [user.id, "active"]
    );
    userSubscriptions = new Set(
      subscriptionsResult.rows.map((row) => row.creator_id)
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <AuthNav user={user} />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Discover Amazing Creators
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Browse, subscribe, and connect with your favorite creators
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
                  className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all transform hover:scale-[1.02] shadow-xl"
                >
                  {/* Creator Header */}
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-20 h-20 bg-linear-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden relative shrink-0 ring-2 ring-white/30">
                        {creator.avatarUrl ? (
                          <Image
                            src={creator.avatarUrl}
                            alt={creator.displayName || creator.email}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-3xl font-bold text-white">
                            {(creator.displayName ||
                              creator.email)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate mb-1">
                          {creator.displayName || creator.email}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4 text-pink-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <p className="text-sm text-white/80">
                            {creator.subscriberCount} subscribers
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {creator.bio && (
                      <p className="text-sm text-white/70 mb-4 line-clamp-2">
                        {creator.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4 text-purple-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm text-white/80">
                          {creator.postCount} posts
                        </span>
                      </div>
                      {creator.subscriptionPriceCents ? (
                        <div className="flex items-center space-x-1">
                          <span className="text-lg font-bold text-white">
                            ${(creator.subscriptionPriceCents / 100).toFixed(2)}
                          </span>
                          <span className="text-xs text-white/60">/mo</span>
                        </div>
                      ) : (
                        <span className="text-sm text-green-300 font-medium">
                          Free
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Link
                          href={`/creators/${creator.id}`}
                          className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-center font-medium text-sm transition-all border border-white/20"
                        >
                          View Profile
                        </Link>
                        {isSubscribed ? (
                          <span className="flex-1 px-4 py-2 bg-green-500/20 border border-green-400/30 text-green-200 rounded-lg text-center font-medium text-sm">
                            ✓ Subscribed
                          </span>
                        ) : (
                          <Link
                            href={`/creators/${creator.id}/subscribe`}
                            className="flex-1 px-4 py-2 bg-linear-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 text-center font-medium text-sm transition-all shadow-lg"
                          >
                            Subscribe
                          </Link>
                        )}
                      </div>
                      {user && user.role === "fan" && (
                        <MessageButton
                          creatorId={creator.id}
                          className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 rounded-lg font-medium text-sm transition-all"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20">
            <div className="inline-flex w-20 h-20 bg-white/10 rounded-full items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No creators yet
            </h3>
            <p className="text-white/70 mb-6">
              Creators will appear here once they&apos;re approved
            </p>
            {user && user.role !== "creator" && (
              <Link
                href="/become-creator"
                className="inline-block px-8 py-3 bg-linear-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 font-semibold transition-all transform hover:scale-105 shadow-lg"
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

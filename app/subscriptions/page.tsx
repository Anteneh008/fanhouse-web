import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import DashboardNav from "@/app/components/DashboardNav";

export default async function SubscriptionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's subscriptions
  const subscriptionsResult = await db.query(
    `SELECT 
      s.*,
      u.email as creator_email,
      cp.display_name as creator_display_name,
      cp.profile_image_url as creator_avatar_url
    FROM subscriptions s
    INNER JOIN users u ON s.creator_id = u.id
    LEFT JOIN creator_profiles cp ON u.id = cp.user_id
    WHERE s.fan_id = $1
    ORDER BY 
      CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
      s.started_at DESC`,
    [user.id]
  );

  const subscriptions = subscriptionsResult.rows.map((row) => ({
    id: row.id,
    creatorId: row.creator_id,
    creatorEmail: row.creator_email,
    creatorDisplayName: row.creator_display_name,
    creatorAvatarUrl: row.creator_avatar_url,
    tierName: row.tier_name,
    priceCents: row.price_cents,
    status: row.status,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    autoRenew: row.auto_renew,
  }));

  // Calculate total monthly cost
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === "active"
  );
  const totalMonthlyCost = activeSubscriptions.reduce(
    (sum, sub) => sum + (sub.priceCents || 0),
    0
  );

  return (
    <>
      <DashboardNav userRole={user.role} />
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            My Subscriptions
          </h1>
          <p className="text-white/80 text-lg">
            Manage your creator subscriptions
          </p>
        </div>

        {/* Summary Card */}
        {activeSubscriptions.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-white/70">
                    Total Monthly Cost
                  </p>
                </div>
                <p className="text-4xl font-bold text-white mt-1">
                  ${(totalMonthlyCost / 100).toFixed(2)}
                </p>
                <p className="text-sm text-white/60 mt-2 flex items-center space-x-1">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>
                    {activeSubscriptions.length} active subscription
                    {activeSubscriptions.length !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end space-x-2 mb-2">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-white/70">
                    Annual Cost
                  </p>
                </div>
                <p className="text-3xl font-bold text-white mt-1">
                  ${((totalMonthlyCost * 12) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscriptions List */}
        {subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Creator Avatar */}
                      <div className="w-20 h-20 rounded-full bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 p-0.5 shrink-0">
                        <div className="w-full h-full rounded-full bg-linear-to-r from-purple-900 to-blue-900 flex items-center justify-center overflow-hidden">
                          {subscription.creatorAvatarUrl ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={subscription.creatorAvatarUrl}
                                alt={
                                  subscription.creatorDisplayName ||
                                  subscription.creatorEmail
                                }
                                fill
                                className="object-cover rounded-full"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-white">
                              {(subscription.creatorDisplayName ||
                                subscription.creatorEmail)[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Creator Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-xl font-bold text-white">
                            {subscription.creatorDisplayName ||
                              subscription.creatorEmail}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              subscription.status === "active"
                                ? "bg-linear-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-400/30"
                                : subscription.status === "canceled"
                                ? "bg-white/10 text-white/70 border border-white/20"
                                : "bg-linear-to-r from-red-500/30 to-pink-500/30 text-red-300 border border-red-400/30"
                            }`}
                          >
                            {subscription.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-4 text-white/80">
                            <div className="flex items-center space-x-1">
                              <svg
                                className="w-4 h-4 text-purple-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                />
                              </svg>
                              <span>
                                Tier:{" "}
                                <span className="font-semibold text-white">
                                  {subscription.tierName}
                                </span>
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <svg
                                className="w-4 h-4 text-blue-400"
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
                              <span className="font-semibold text-white">
                                ${(subscription.priceCents / 100).toFixed(2)}
                                /month
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-white/70">
                            <div className="flex items-center space-x-1">
                              <svg
                                className="w-4 h-4 text-white/50"
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
                                Started:{" "}
                                {new Date(
                                  subscription.startedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            {subscription.expiresAt && (
                              <div className="flex items-center space-x-1">
                                <svg
                                  className="w-4 h-4 text-white/50"
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
                                <span>
                                  {subscription.status === "active"
                                    ? `Renews: ${new Date(
                                        subscription.expiresAt
                                      ).toLocaleDateString()}`
                                    : `Expired: ${new Date(
                                        subscription.expiresAt
                                      ).toLocaleDateString()}`}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 text-white/70">
                            <svg
                              className="w-4 h-4 text-white/50"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={
                                  subscription.autoRenew
                                    ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                }
                              />
                            </svg>
                            <span>
                              Auto-renew:{" "}
                              <span
                                className={
                                  subscription.autoRenew
                                    ? "text-green-400 font-semibold"
                                    : "text-red-400 font-semibold"
                                }
                              >
                                {subscription.autoRenew ? "Yes" : "No"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex flex-col space-y-2 shrink-0">
                      <Link
                        href={`/creators/${subscription.creatorId}`}
                        className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-center font-semibold text-sm border border-white/20 transition-all duration-300 hover:border-white/30"
                      >
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span>View Profile</span>
                      </Link>
                      {subscription.status === "active" && (
                        <Link
                          href={`/subscriptions/${subscription.id}/cancel`}
                          className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-linear-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 text-center font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span>Cancel</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center shadow-xl border border-white/20">
            <svg
              className="w-20 h-20 text-white/40 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <h3 className="text-2xl font-bold text-white mb-2">
              No subscriptions yet
            </h3>
            <p className="text-white/70 mb-6 text-lg">
              Start subscribing to creators to access exclusive content
            </p>
            <Link
              href="/creators"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <svg
                className="w-5 h-5"
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
              <span>Discover Creators</span>
            </Link>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

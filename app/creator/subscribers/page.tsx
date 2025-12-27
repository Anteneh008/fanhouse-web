import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";

export default async function CreatorSubscribersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "creator") {
    redirect("/become-creator");
  }

  if (user.creatorStatus !== "approved") {
    redirect("/creator/status");
  }

  // Get active subscriptions
  const subscriptionsResult = await db.query(
    `SELECT 
      s.*,
      u.email as fan_email,
      u.created_at as fan_joined_at
    FROM subscriptions s
    INNER JOIN users u ON s.fan_id = u.id
    WHERE s.creator_id = $1 AND s.status = 'active'
    ORDER BY s.started_at DESC`,
    [user.id]
  );

  const subscriptions = subscriptionsResult.rows.map((row) => ({
    id: row.id,
    fanId: row.fan_id,
    fanEmail: row.fan_email,
    fanJoinedAt: row.fan_joined_at,
    tierName: row.tier_name,
    priceCents: row.price_cents,
    status: row.status,
    startedAt: row.started_at,
    expiresAt: row.expires_at,
    autoRenew: row.auto_renew,
  }));

  // Get subscription stats
  const statsResult = await db.query(
    `SELECT 
      COUNT(*) as total,
      SUM(price_cents) as monthly_revenue_cents
    FROM subscriptions
    WHERE creator_id = $1 AND status = 'active'`,
    [user.id]
  );

  const stats = {
    total: parseInt(statsResult.rows[0]?.total || "0"),
    monthlyRevenueCents: parseInt(
      statsResult.rows[0]?.monthly_revenue_cents || "0"
    ),
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Subscribers
          </h1>
          <p className="text-white/80 text-lg">Manage your subscriber base</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
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
                <p className="text-sm font-medium text-white/70">
                  Active Subscribers
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
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
                  Monthly Revenue
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(stats.monthlyRevenueCents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscribers List */}
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>Active Subscriptions</span>
          </h2>

          {subscriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Subscriber
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Started
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Auto Renew
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {subscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white">
                          {sub.fanEmail}
                        </div>
                        <div className="text-xs text-white/60 mt-1 flex items-center space-x-1">
                          <svg
                            className="w-3 h-3"
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
                            Joined{" "}
                            {new Date(sub.fanJoinedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-sm">
                          {sub.tierName}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-white/70">
                        {new Date(sub.startedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-white/70">
                        {sub.expiresAt
                          ? new Date(sub.expiresAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "Never"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-semibold text-right">
                        ${(sub.priceCents / 100).toFixed(2)}/mo
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {sub.autoRenew ? (
                          <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-500/20 text-green-300 border border-green-500/30 backdrop-blur-sm">
                            ✓ Yes
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-white/10 text-white/70 border border-white/20 backdrop-blur-sm">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-white/70 font-medium mb-2">
                No active subscribers yet
              </p>
              <p className="text-sm text-white/50">
                Start creating content to attract subscribers
              </p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/20 backdrop-blur-lg border border-blue-500/30 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-blue-300 mb-4 flex items-center space-x-2">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Subscription Management</span>
          </h3>
          <ul className="text-sm text-blue-200 space-y-2">
            <li className="flex items-start space-x-2">
              <span className="text-blue-300 mt-0.5">•</span>
              <span>Subscribers can access all subscriber-only content</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-300 mt-0.5">•</span>
              <span>Auto-renew subscriptions continue until canceled</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-300 mt-0.5">•</span>
              <span>
                Monthly revenue is calculated from active subscriptions
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-300 mt-0.5">•</span>
              <span>Subscribers are charged automatically each month</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

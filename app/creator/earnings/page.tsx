import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCreatorEarnings, getCreatorLedger } from "@/lib/ledger";
import Link from "next/link";

export default async function CreatorEarningsPage() {
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

  // Get earnings summary
  const earnings = await getCreatorEarnings(user.id);

  // Get ledger entries
  const ledgerEntries = await getCreatorLedger(user.id, 50, 0);

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Earnings
          </h1>
          <p className="text-white/80 text-lg">
            Track your earnings and payout history
          </p>
        </div>

        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
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
                  Total Earned
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(earnings.totalEarningsCents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/70">Paid Out</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(earnings.totalPayoutsCents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Entries */}
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <span>Transaction History</span>
          </h2>

          {ledgerEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Platform Fee
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Net Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {ledgerEntries.map(
                    (entry: {
                      id: string;
                      entry_type: string;
                      description: string | null;
                      amount_cents: number;
                      platform_fee_cents: number;
                      net_amount_cents: number;
                      created_at: Date;
                    }) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-white/90">
                          {new Date(entry.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full backdrop-blur-sm ${
                              entry.entry_type === "earnings"
                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                : entry.entry_type === "payout"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : entry.entry_type === "refund"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : "bg-white/10 text-white/70 border border-white/20"
                            }`}
                          >
                            {entry.entry_type}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-white/70">
                          {entry.description || "—"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-white font-medium text-right">
                          ${(entry.amount_cents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-white/60 text-right">
                          ${(entry.platform_fee_cents / 100).toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-4 whitespace-nowrap text-sm font-bold text-right ${
                            entry.net_amount_cents >= 0
                              ? "text-green-300"
                              : "text-red-300"
                          }`}
                        >
                          ${(entry.net_amount_cents / 100).toFixed(2)}
                        </td>
                      </tr>
                    )
                  )}
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <p className="text-white/70 font-medium">No transactions yet</p>
              <p className="text-sm text-white/50 mt-2">
                Earnings will appear here once you start receiving payments
              </p>
            </div>
          )}
        </div>

        {/* Request Payout Button */}
        {earnings.pendingEarningsCents >= 1000 && (
          <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
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
                  <span>Request Payout</span>
                </h3>
                <p className="text-sm text-white/70">
                  You have{" "}
                  <span className="font-semibold text-white">
                    ${(earnings.pendingEarningsCents / 100).toFixed(2)}
                  </span>{" "}
                  available for payout
                </p>
              </div>
              <Link
                href="/creator/payouts"
                className="px-6 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Request Payout</span>
              </Link>
            </div>
          </div>
        )}

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
            <span>How Earnings Work</span>
          </h3>
          <ul className="text-sm text-blue-200 space-y-2">
            <li className="flex items-start space-x-2">
              <span className="text-blue-300 mt-0.5">•</span>
              <span>
                Platform fee:{" "}
                <span className="font-semibold text-white">20%</span> of each
                transaction
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-300 mt-0.5">•</span>
              <span>Net amount: Amount you receive after fees</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-300 mt-0.5">•</span>
              <span>Pending: Earnings not yet paid out</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-300 mt-0.5">•</span>
              <span>
                Minimum payout:{" "}
                <span className="font-semibold text-white">$10.00</span>
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-300 mt-0.5">•</span>
              <span>Ledger is append-only for transparency</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";

export default async function AdminTransactionsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  // Get all transactions with earnings breakdown
  const transactionsResult = await db.query(
    `SELECT 
      t.*,
      u_fan.email as fan_email,
      u_creator.email as creator_email,
      cp.display_name as creator_display_name,
      le.platform_fee_cents,
      le.net_amount_cents as creator_earnings_cents
    FROM transactions t
    LEFT JOIN users u_fan ON t.user_id = u_fan.id
    LEFT JOIN users u_creator ON t.creator_id = u_creator.id
    LEFT JOIN creator_profiles cp ON t.creator_id = cp.user_id
    LEFT JOIN ledger_entries le ON t.id = le.transaction_id AND le.entry_type = 'earnings'
    ORDER BY t.created_at DESC
    LIMIT 200`
  );

  const transactions = transactionsResult.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    fanEmail: row.fan_email,
    creatorId: row.creator_id,
    creatorEmail: row.creator_email,
    creatorDisplayName: row.creator_display_name,
    amountCents: row.amount_cents,
    platformFeeCents:
      row.platform_fee_cents || Math.floor(row.amount_cents * 0.2), // 20% platform fee
    creatorEarningsCents:
      row.creator_earnings_cents || Math.floor(row.amount_cents * 0.8), // 80% to creator
    transactionType: row.transaction_type,
    status: row.status,
    paymentMethod: row.payment_provider,
    createdAt: row.created_at,
  }));

  // Get stats with earnings breakdown
  const statsResult = await db.query(
    `SELECT 
      COUNT(*) FILTER (WHERE t.status = 'completed') as completed,
      COUNT(*) FILTER (WHERE t.status = 'pending') as pending,
      COUNT(*) FILTER (WHERE t.status = 'failed') as failed,
      SUM(t.amount_cents) FILTER (WHERE t.status = 'completed') as total_revenue_cents,
      SUM(COALESCE(le.platform_fee_cents, FLOOR(t.amount_cents * 0.2))) FILTER (WHERE t.status = 'completed') as total_platform_fee_cents,
      SUM(COALESCE(le.net_amount_cents, FLOOR(t.amount_cents * 0.8))) FILTER (WHERE t.status = 'completed') as total_creator_earnings_cents
    FROM transactions t
    LEFT JOIN ledger_entries le ON t.id = le.transaction_id AND le.entry_type = 'earnings'`
  );

  const stats = {
    completed: parseInt(statsResult.rows[0]?.completed || "0"),
    pending: parseInt(statsResult.rows[0]?.pending || "0"),
    failed: parseInt(statsResult.rows[0]?.failed || "0"),
    totalRevenueCents: parseInt(
      statsResult.rows[0]?.total_revenue_cents || "0"
    ),
    totalPlatformFeeCents: parseInt(
      statsResult.rows[0]?.total_platform_fee_cents || "0"
    ),
    totalCreatorEarningsCents: parseInt(
      statsResult.rows[0]?.total_creator_earnings_cents || "0"
    ),
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Transactions
          </h1>
          <p className="text-white/80 text-lg font-medium">
            Review and manage platform transactions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-green-500/20">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
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
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(stats.totalRevenueCents / 100).toFixed(2)}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  From all transactions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/20">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Platform Fee
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(stats.totalPlatformFeeCents / 100).toFixed(2)}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {stats.totalRevenueCents > 0
                    ? (
                        (stats.totalPlatformFeeCents /
                          stats.totalRevenueCents) *
                        100
                      ).toFixed(1)
                    : "0"}
                  % of revenue
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
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
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Creator Earnings
                </p>
                <p className="text-2xl font-bold text-green-300 mt-1">
                  ${(stats.totalCreatorEarningsCents / 100).toFixed(2)}
                </p>
                <p className="text-xs text-white/60 mt-1">
                  {stats.totalRevenueCents > 0
                    ? (
                        (stats.totalCreatorEarningsCents /
                          stats.totalRevenueCents) *
                        100
                      ).toFixed(1)
                    : "0"}
                  % of revenue
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-green-500/20">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
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
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Completed
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-yellow-500/20">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
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
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Pending
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-red-500/20">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Failed
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.failed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/80 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/80 uppercase tracking-wider">
                    Fan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/80 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/80 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white/80 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white/80 uppercase tracking-wider">
                    Platform Fee
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-white/80 uppercase tracking-wider">
                    Creator Earnings
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/80 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/80 uppercase tracking-wider">
                    Payment Method
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      <div className="flex items-center space-x-1">
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
                          {new Date(transaction.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-400/30 to-indigo-500/30 flex items-center justify-center shrink-0">
                          <svg
                            className="w-3 h-3 text-blue-300"
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
                        </div>
                        <div className="text-sm font-medium text-white">
                          {transaction.fanEmail || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-linear-to-br from-purple-400/30 to-pink-500/30 flex items-center justify-center shrink-0">
                          <svg
                            className="w-3 h-3 text-purple-300"
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
                        </div>
                        <div className="text-sm font-medium text-white">
                          {transaction.creatorDisplayName ||
                            transaction.creatorEmail ||
                            "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1.5 inline-flex items-center text-xs font-bold rounded-full bg-white/10 border border-white/20 text-white/90">
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-right font-bold">
                      <div className="flex items-center justify-end space-x-1">
                        <svg
                          className="w-3 h-3 text-green-300"
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
                        <span>
                          ${(transaction.amountCents / 100).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <span className="font-semibold">
                          ${(transaction.platformFeeCents / 100).toFixed(2)}
                        </span>
                        <span className="text-xs text-white/60">
                          (
                          {(
                            (transaction.platformFeeCents /
                              transaction.amountCents) *
                            100
                          ).toFixed(0)}
                          %)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-300 text-right font-bold">
                      <div className="flex items-center justify-end space-x-1">
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
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span>
                          ${(transaction.creatorEarningsCents / 100).toFixed(2)}
                        </span>
                        <span className="text-xs text-white/60 font-normal">
                          (
                          {(
                            (transaction.creatorEarningsCents /
                              transaction.amountCents) *
                            100
                          ).toFixed(0)}
                          %)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                          transaction.status === "completed"
                            ? "bg-linear-to-r from-green-500/30 to-emerald-500/30 border border-green-400/50 text-green-200"
                            : transaction.status === "pending"
                            ? "bg-linear-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-400/50 text-yellow-200"
                            : transaction.status === "failed"
                            ? "bg-linear-to-r from-red-500/30 to-red-600/30 border border-red-400/50 text-red-200"
                            : "bg-white/10 border border-white/20 text-white/90"
                        }`}
                      >
                        {transaction.status === "completed" && (
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        {transaction.status === "pending" && (
                          <svg
                            className="w-3 h-3 mr-1"
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
                        )}
                        {transaction.status === "failed" && (
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      <div className="flex items-center space-x-1">
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
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        <span>{transaction.paymentMethod || "N/A"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 mb-4">
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
                <p className="text-white/60 font-medium text-lg">
                  No transactions found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

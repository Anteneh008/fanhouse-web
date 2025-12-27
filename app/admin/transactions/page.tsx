import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

export default async function AdminTransactionsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/');
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
    platformFeeCents: row.platform_fee_cents || Math.floor(row.amount_cents * 0.2), // 20% platform fee
    creatorEarningsCents: row.creator_earnings_cents || Math.floor(row.amount_cents * 0.8), // 80% to creator
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
    completed: parseInt(statsResult.rows[0]?.completed || '0'),
    pending: parseInt(statsResult.rows[0]?.pending || '0'),
    failed: parseInt(statsResult.rows[0]?.failed || '0'),
    totalRevenueCents: parseInt(statsResult.rows[0]?.total_revenue_cents || '0'),
    totalPlatformFeeCents: parseInt(statsResult.rows[0]?.total_platform_fee_cents || '0'),
    totalCreatorEarningsCents: parseInt(statsResult.rows[0]?.total_creator_earnings_cents || '0'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-2 text-gray-600">
            Review and manage platform transactions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(stats.totalRevenueCents / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">From all transactions</p>
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
                <p className="text-sm font-medium text-gray-500">Platform Fee</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(stats.totalPlatformFeeCents / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {(stats.totalRevenueCents > 0 
                    ? (stats.totalPlatformFeeCents / stats.totalRevenueCents * 100).toFixed(1) 
                    : '0')}% of revenue
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Creator Earnings</p>
                <p className="text-2xl font-semibold text-green-600">
                  ${(stats.totalCreatorEarningsCents / 100).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {(stats.totalRevenueCents > 0 
                    ? (stats.totalCreatorEarningsCents / stats.totalRevenueCents * 100).toFixed(1) 
                    : '0')}% of revenue
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">F</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.failed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform Fee
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transaction.fanEmail || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transaction.creatorDisplayName || transaction.creatorEmail || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {transaction.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ${(transaction.amountCents / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      ${(transaction.platformFeeCents / 100).toFixed(2)}
                      <span className="text-xs text-gray-400 ml-1">
                        ({(transaction.platformFeeCents / transaction.amountCents * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right font-semibold">
                      ${(transaction.creatorEarningsCents / 100).toFixed(2)}
                      <span className="text-xs text-gray-400 ml-1">
                        ({(transaction.creatorEarningsCents / transaction.amountCents * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : transaction.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.paymentMethod || 'N/A'}
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


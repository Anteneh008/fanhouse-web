import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import ProcessPayoutButton from './ProcessPayoutButton';

export default async function AdminPayoutsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    redirect('/');
  }

  // Get all payouts
  const payoutsResult = await db.query(
    `SELECT 
      p.*,
      u.email as creator_email,
      cp.display_name as creator_display_name,
      admin_user.email as processed_by_email
    FROM payouts p
    INNER JOIN users u ON p.creator_id = u.id
    LEFT JOIN creator_profiles cp ON p.creator_id = cp.user_id
    LEFT JOIN users admin_user ON p.processed_by = admin_user.id
    ORDER BY p.created_at DESC
    LIMIT 200`
  );

  const payouts = payoutsResult.rows.map((row) => ({
    id: row.id,
    creatorId: row.creator_id,
    creatorEmail: row.creator_email,
    creatorDisplayName: row.creator_display_name,
    amountCents: row.amount_cents,
    status: row.status,
    payoutMethod: row.payout_method,
    payoutDetails: row.payout_details,
    adminNotes: row.admin_notes,
    processedBy: row.processed_by_email,
    processedAt: row.processed_at,
    failureReason: row.failure_reason,
    createdAt: row.created_at,
  }));

  // Get stats
  const statsResult = await db.query(
    `SELECT 
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'processing') as processing,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      SUM(amount_cents) FILTER (WHERE status = 'pending') as pending_amount_cents,
      SUM(amount_cents) FILTER (WHERE status = 'completed') as completed_amount_cents
    FROM payouts`
  );

  const stats = {
    pending: parseInt(statsResult.rows[0]?.pending || '0'),
    processing: parseInt(statsResult.rows[0]?.processing || '0'),
    completed: parseInt(statsResult.rows[0]?.completed || '0'),
    failed: parseInt(statsResult.rows[0]?.failed || '0'),
    pendingAmountCents: parseInt(statsResult.rows[0]?.pending_amount_cents || '0'),
    completedAmountCents: parseInt(statsResult.rows[0]?.completed_amount_cents || '0'),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
          <p className="mt-2 text-gray-600">Review and process creator payout requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm font-medium text-gray-500">Pending</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            <p className="text-xs text-gray-400 mt-1">
              ${(stats.pendingAmountCents / 100).toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm font-medium text-gray-500">Processing</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.processing}</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-400 mt-1">
              ${(stats.completedAmountCents / 100).toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm font-medium text-gray-500">Failed</p>
            <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creator</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payouts.length > 0 ? (
                  payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payout.creatorDisplayName || payout.creatorEmail}
                        </div>
                        <div className="text-xs text-gray-500">{payout.creatorEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        ${(payout.amountCents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payout.payoutMethod.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payout.processedBy || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payout.status === 'pending' || payout.status === 'processing' ? (
                          <ProcessPayoutButton payoutId={payout.id} />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No payout requests yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


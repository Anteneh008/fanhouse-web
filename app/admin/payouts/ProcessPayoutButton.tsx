'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProcessPayoutButtonProps {
  payoutId: string;
}

export default function ProcessPayoutButton({ payoutId }: ProcessPayoutButtonProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'cancel'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [failureReason, setFailureReason] = useState('');

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNotes,
          failureReason: action === 'reject' ? failureReason : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process payout');
      }

      setShowModal(false);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to process payout');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-blue-600 hover:text-blue-500 text-sm font-medium"
      >
        Process
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Payout</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as 'approve' | 'reject' | 'cancel')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="approve">Approve & Complete</option>
                  <option value="reject">Reject</option>
                  <option value="cancel">Cancel</option>
                </select>
              </div>

              {action === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Failure Reason
                  </label>
                  <textarea
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Reason for rejection..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Internal notes..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className={`flex-1 px-4 py-2 rounded-md font-medium ${
                    action === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : action === 'reject'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  } disabled:opacity-50`}
                >
                  {processing ? 'Processing...' : action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setAdminNotes('');
                    setFailureReason('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


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
        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 text-blue-200 rounded-lg text-xs font-semibold transition-all duration-300 transform hover:scale-105"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Process</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Process Payout
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-white/90 mb-2 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Action</span>
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as 'approve' | 'reject' | 'cancel')}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300"
                >
                  <option value="approve" className="bg-purple-900">Approve & Complete</option>
                  <option value="reject" className="bg-purple-900">Reject</option>
                  <option value="cancel" className="bg-purple-900">Cancel</option>
                </select>
              </div>

              {action === 'reject' && (
                <div>
                  <label className="block text-sm font-bold text-white/90 mb-2 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Failure Reason</span>
                  </label>
                  <textarea
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/50 transition-all duration-300"
                    rows={2}
                    placeholder="Reason for rejection..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-white/90 mb-2 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Admin Notes (Optional)</span>
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300"
                  rows={3}
                  placeholder="Internal notes..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                    action === 'approve'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-green-500/50'
                      : action === 'reject'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-red-500/50'
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:shadow-gray-500/50'
                  }`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </span>
                  ) : (
                    action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Cancel'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setAdminNotes('');
                    setFailureReason('');
                  }}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
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


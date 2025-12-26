'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Creator {
  id: string;
  email: string;
  creator_status: string | null;
  created_at: string;
  display_name: string | null;
  bio: string | null;
  kyc_status: string | null;
  rejection_reason: string | null;
}

interface CreatorManagementProps {
  creators: Creator[];
}

export default function CreatorManagement({ creators: initialCreators }: CreatorManagementProps) {
  const router = useRouter();
  const [creators, setCreators] = useState(initialCreators);
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>({});

  const handleApprove = async (userId: string) => {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/creators/${userId}/approve`, {
        method: 'POST',
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to approve creator');
      }
    } catch (error) {
      alert('Error approving creator');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = rejectReason[userId] || 'Application rejected by admin';
    
    if (!confirm(`Reject this creator? Reason: ${reason}`)) {
      return;
    }

    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/creators/${userId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to reject creator');
      }
    } catch (error) {
      alert('Error rejecting creator');
    } finally {
      setLoading(null);
    }
  };

  const pendingCreators = creators.filter((c) => c.creator_status === 'pending');
  const approvedCreators = creators.filter((c) => c.creator_status === 'approved');
  const rejectedCreators = creators.filter((c) => c.creator_status === 'rejected');

  return (
    <div className="space-y-8">
      {/* Pending Applications */}
      {pendingCreators.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pending Applications ({pendingCreators.length})
          </h2>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {pendingCreators.map((creator) => (
                <div key={creator.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {creator.display_name || 'No display name'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{creator.email}</p>
                      {creator.bio && (
                        <p className="text-sm text-gray-700 mt-2">{creator.bio}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Applied: {new Date(creator.created_at).toLocaleDateString()}</span>
                        <span>KYC: {creator.kyc_status || 'Not started'}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => handleApprove(creator.id)}
                        disabled={loading === creator.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading === creator.id ? 'Approving...' : 'Approve'}
                      </button>
                      <div className="flex flex-col">
                        <input
                          type="text"
                          placeholder="Rejection reason"
                          value={rejectReason[creator.id] || ''}
                          onChange={(e) =>
                            setRejectReason({ ...rejectReason, [creator.id]: e.target.value })
                          }
                          className="px-3 py-1 text-sm border border-gray-300 rounded mb-1"
                        />
                        <button
                          onClick={() => handleReject(creator.id)}
                          disabled={loading === creator.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                        >
                          {loading === creator.id ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approved Creators */}
      {approvedCreators.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Approved Creators ({approvedCreators.length})
          </h2>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {approvedCreators.map((creator) => (
                <div key={creator.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {creator.display_name || creator.email}
                      </h3>
                      <p className="text-sm text-gray-500">{creator.email}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Approved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rejected Creators */}
      {rejectedCreators.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Rejected Applications ({rejectedCreators.length})
          </h2>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {rejectedCreators.map((creator) => (
                <div key={creator.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {creator.display_name || creator.email}
                      </h3>
                      <p className="text-sm text-gray-500">{creator.email}</p>
                      {creator.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {creator.rejection_reason}
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      Rejected
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {creators.length === 0 && (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">No creator applications yet</p>
        </div>
      )}
    </div>
  );
}


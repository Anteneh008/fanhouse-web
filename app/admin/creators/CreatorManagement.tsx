"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function CreatorManagement({
  creators: initialCreators,
}: CreatorManagementProps) {
  const router = useRouter();
  const creators = initialCreators;
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [key: string]: string }>(
    {}
  );

  const handleApprove = async (userId: string) => {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/creators/${userId}/approve`, {
        method: "POST",
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to approve creator");
      }
    } catch {
      alert("Error approving creator");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = rejectReason[userId] || "Application rejected by admin";

    if (!confirm(`Reject this creator? Reason: ${reason}`)) {
      return;
    }

    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/creators/${userId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to reject creator");
      }
    } catch {
      alert("Error rejecting creator");
    } finally {
      setLoading(null);
    }
  };

  const pendingCreators = creators.filter(
    (c) => c.creator_status === "pending"
  );
  const approvedCreators = creators.filter(
    (c) => c.creator_status === "approved"
  );
  const rejectedCreators = creators.filter(
    (c) => c.creator_status === "rejected"
  );

  return (
    <div className="space-y-8">
      {/* Pending Applications */}
      {pendingCreators.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <svg
              className="w-6 h-6 text-yellow-300"
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
            <span>Pending Applications</span>
            <span className="ml-2 px-3 py-1 bg-yellow-500/30 border border-yellow-400/50 text-yellow-200 rounded-full text-sm font-bold">
              {pendingCreators.length}
            </span>
          </h2>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="divide-y divide-white/10">
              {pendingCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400/30 to-orange-500/30 flex items-center justify-center shrink-0">
                          <svg
                            className="w-6 h-6 text-yellow-300"
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
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white">
                            {creator.display_name || "No display name"}
                          </h3>
                          <p className="text-sm text-white/70 mt-1 flex items-center space-x-1">
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
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <span>{creator.email}</span>
                          </p>
                          {creator.bio && (
                            <p className="text-sm text-white/80 mt-3 bg-white/5 rounded-lg p-3 border border-white/10">
                              {creator.bio}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/60">
                            <span className="flex items-center space-x-1">
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
                                Applied:{" "}
                                {new Date(
                                  creator.created_at
                                ).toLocaleDateString()}
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
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
                                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                              </svg>
                              <span>
                                KYC: {creator.kyc_status || "Not started"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleApprove(creator.id)}
                        disabled={loading === creator.id}
                        className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:transform-none"
                      >
                        {loading === creator.id ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span>Approving...</span>
                          </>
                        ) : (
                          <>
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Rejection reason (optional)"
                          value={rejectReason[creator.id] || ""}
                          onChange={(e) =>
                            setRejectReason({
                              ...rejectReason,
                              [creator.id]: e.target.value,
                            })
                          }
                          className="px-4 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/50 transition-all duration-300"
                        />
                        <button
                          onClick={() => handleReject(creator.id)}
                          disabled={loading === creator.id}
                          className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:transform-none"
                        >
                          {loading === creator.id ? (
                            <>
                              <svg
                                className="animate-spin h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span>Rejecting...</span>
                            </>
                          ) : (
                            <>
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
                              <span>Reject</span>
                            </>
                          )}
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
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <svg
              className="w-6 h-6 text-green-300"
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
            <span>Approved Creators</span>
            <span className="ml-2 px-3 py-1 bg-green-500/30 border border-green-400/50 text-green-200 rounded-full text-sm font-bold">
              {approvedCreators.length}
            </span>
          </h2>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="divide-y divide-white/10">
              {approvedCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="p-5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/30 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-green-300"
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
                      <div>
                        <h3 className="font-bold text-white">
                          {creator.display_name || creator.email}
                        </h3>
                        <p className="text-sm text-white/70 flex items-center space-x-1 mt-1">
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
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{creator.email}</span>
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/50 text-green-200 rounded-full text-sm font-bold">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
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
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <svg
              className="w-6 h-6 text-red-300"
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
            <span>Rejected Applications</span>
            <span className="ml-2 px-3 py-1 bg-red-500/30 border border-red-400/50 text-red-200 rounded-full text-sm font-bold">
              {rejectedCreators.length}
            </span>
          </h2>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="divide-y divide-white/10">
              {rejectedCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="p-5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400/30 to-red-600/30 flex items-center justify-center shrink-0">
                        <svg
                          className="w-5 h-5 text-red-300"
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
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white">
                          {creator.display_name || creator.email}
                        </h3>
                        <p className="text-sm text-white/70 flex items-center space-x-1 mt-1">
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
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{creator.email}</span>
                        </p>
                        {creator.rejection_reason && (
                          <div className="mt-3 bg-red-500/20 border border-red-400/30 rounded-lg p-3">
                            <p className="text-sm text-red-200 flex items-start space-x-2">
                              <svg
                                className="w-4 h-4 mt-0.5 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>
                                <strong>Reason:</strong>{" "}
                                {creator.rejection_reason}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="ml-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500/30 to-red-600/30 border border-red-400/50 text-red-200 rounded-full text-sm font-bold shrink-0">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
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
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12 text-center">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p className="text-white/60 font-medium text-lg">
            No creator applications yet
          </p>
        </div>
      )}
    </div>
  );
}

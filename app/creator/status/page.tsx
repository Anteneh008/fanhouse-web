"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CreatorStatus {
  role: string;
  creatorStatus: string | null;
  profile: {
    display_name: string;
    bio: string | null;
  } | null;
  kyc: {
    status: string;
    rejectionReason: string | null;
  } | null;
}

export default function CreatorStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CreatorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/creators/status")
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch status");
        }
        return res.json();
      })
      .then((data) => {
        setStatus(data);
        setLoading(false);

        // Redirect if approved
        if (data.creatorStatus === "approved") {
          setTimeout(() => {
            router.push("/creator/dashboard");
          }, 2000);
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-300/30 border-t-purple-300 mx-auto"></div>
          <p className="mt-6 text-white/90 text-lg font-medium">
            Loading status...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="max-w-md w-full space-y-8 p-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 relative z-10">
          <div className="bg-linear-to-r from-red-500/20 to-red-600/20 border border-red-400/40 text-red-100 px-6 py-4 rounded-2xl backdrop-blur-sm shadow-lg">
            <div className="flex items-center space-x-3 mb-2">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-bold text-lg">Error</p>
            </div>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <div className="text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-linear-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white rounded-xl font-semibold border border-white/30 transition-all duration-300 transform hover:scale-105"
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="max-w-md w-full space-y-8 p-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 relative z-10">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-r from-gray-500/30 to-gray-700/30 flex items-center justify-center shadow-lg">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-gray-600/20 to-gray-800/20 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-300"
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
            </div>
            <h2 className="text-4xl font-bold mb-3 bg-linear-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">
              Not a Creator
            </h2>
            <p className="text-white/80 text-lg">
              You haven&apos;t applied to become a creator yet
            </p>
          </div>
          <div className="text-center space-y-5">
            <Link
              href="/become-creator"
              className="inline-flex items-center justify-center space-x-2 w-full px-6 py-4 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Apply to Become a Creator</span>
            </Link>
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 text-white/70 hover:text-white font-medium transition-colors hover:underline"
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending status
  if (status.creatorStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="max-w-md w-full space-y-8 p-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 relative z-10">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-br from-yellow-400/30 to-yellow-600/30 flex items-center justify-center shadow-lg shadow-yellow-500/20 animate-pulse">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-yellow-400/20 to-yellow-600/20 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-yellow-300"
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
            <h2 className="text-4xl font-bold mb-3 bg-linear-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
              Application Pending
            </h2>
            <p className="text-white/80 text-lg">
              Your creator application is under review
            </p>
          </div>

          {status.profile && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="font-bold text-white mb-4 flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-purple-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Your Application</span>
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-white/60 text-sm mb-1">Display Name</dt>
                  <dd className="text-white font-semibold text-lg">
                    {status.profile.display_name}
                  </dd>
                </div>
                {status.profile.bio && (
                  <div>
                    <dt className="text-white/60 text-sm mb-1">Bio</dt>
                    <dd className="text-white/90">{status.profile.bio}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="bg-linear-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-400/40 text-yellow-100 px-6 py-4 rounded-2xl backdrop-blur-sm shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-bold text-lg">Status: Pending Review</p>
            </div>
            <p className="text-sm leading-relaxed">
              We&apos;re reviewing your application. You&apos;ll be notified
              once a decision is made.
            </p>
            {status.kyc && (
              <p className="text-sm mt-3 pt-3 border-t border-yellow-400/30">
                KYC Status:{" "}
                <span className="font-bold">{status.kyc.status}</span>
              </p>
            )}
          </div>

          <div className="text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-3 px-8 py-4 bg-linear-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white rounded-xl font-semibold border border-white/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-white/10"
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Rejected status
  if (status.creatorStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="max-w-md w-full space-y-8 p-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 relative z-10">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-br from-red-500/30 to-red-700/30 flex items-center justify-center shadow-lg shadow-red-500/20">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-red-500/20 to-red-700/20 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-red-300"
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
            <h2 className="text-4xl font-bold mb-3 bg-linear-to-r from-red-200 to-red-400 bg-clip-text text-transparent">
              Application Rejected
            </h2>
            <p className="text-white/80 text-lg">
              Your creator application was not approved
            </p>
          </div>

          <div className="bg-linear-to-r from-red-500/20 to-red-600/20 border border-red-400/40 text-red-100 px-6 py-4 rounded-2xl backdrop-blur-sm shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-bold text-lg">Status: Rejected</p>
            </div>
            {status.kyc?.rejectionReason && (
              <div className="mb-3 pb-3 border-b border-red-400/30">
                <p className="text-sm">
                  <strong className="font-semibold">Reason:</strong>{" "}
                  {status.kyc.rejectionReason}
                </p>
              </div>
            )}
            <p className="text-sm leading-relaxed">
              You can reapply to become a creator. Please review the rejection
              reason and ensure your application meets our requirements.
            </p>
          </div>

          <div className="text-center space-y-5">
            <Link
              href="/become-creator"
              className="inline-flex items-center justify-center space-x-2 w-full px-6 py-4 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Reapply to Become a Creator</span>
            </Link>
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 text-white/70 hover:text-white font-medium transition-colors hover:underline"
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Approved status
  if (status.creatorStatus === "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        <div className="max-w-md w-full space-y-8 p-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 relative z-10">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-r from-green-400 via-emerald-500 to-green-600 p-1 shadow-lg shadow-green-500/30 animate-pulse">
              <div className="w-full h-full rounded-full bg-linear-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-green-300 drop-shadow-lg"
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
            <h2 className="text-4xl font-bold mb-3 bg-linear-to-r from-green-200 via-emerald-300 to-green-400 bg-clip-text text-transparent">
              Application Approved!
            </h2>
            <p className="text-white/90 text-lg font-medium">
              Congratulations! You&apos;re now a creator
            </p>
          </div>

          <div className="bg-linear-to-r from-green-500/20 to-emerald-600/20 border border-green-400/40 text-green-100 px-6 py-4 rounded-2xl backdrop-blur-sm shadow-lg">
            <div className="flex items-center space-x-3 mb-3">
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
              <p className="font-bold text-lg">Status: Approved</p>
            </div>
            <p className="text-sm leading-relaxed">
              You can now start creating content and monetizing your profile.
            </p>
          </div>

          <div className="text-center space-y-5">
            <p className="text-sm text-white/70 mb-2 animate-pulse">
              Redirecting to your creator dashboard...
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/creator/verify"
                className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>Complete Verification</span>
              </Link>
              <Link
                href="/creator/dashboard"
                className="flex-1 inline-flex items-center justify-center space-x-2 px-6 py-4 bg-linear-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white rounded-xl font-semibold border border-white/30 transition-all duration-300 transform hover:scale-105"
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Go to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <div className="max-w-md w-full space-y-8 p-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 relative z-10">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Creator Status
          </h2>
        </div>
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-linear-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white rounded-xl font-semibold border border-white/30 transition-all duration-300 transform hover:scale-105"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

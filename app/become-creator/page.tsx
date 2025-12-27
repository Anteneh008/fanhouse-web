"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardNav from "@/app/components/DashboardNav";

export default function BecomeCreatorPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<"fan" | "creator" | "admin">("fan");
  const [status, setStatus] = useState<{
    role: string;
    creatorStatus: string | null;
  } | null>(null);

  useEffect(() => {
    // Fetch user role
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role) {
          setUserRole(data.user.role);
        }
      })
      .catch(() => {
        // Default to fan if fetch fails
        setUserRole("fan");
      });

    // Check current status
    fetch("/api/creators/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.role === "creator") {
          setStatus(data);
          if (data.creatorStatus === "approved") {
            router.push("/creator/dashboard");
          }
        }
      })
      .catch(() => {
        // Not authenticated or error
      });
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/creators/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName, bio }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Application failed");
        setIsLoading(false);
        return;
      }

      // Success - redirect to status page or dashboard
      router.push("/creator/status");
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Show status if already applied
  if (status?.creatorStatus === "pending") {
    return (
      <>
        <DashboardNav userRole={userRole} />
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          <div className="max-w-md w-full space-y-8 p-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 relative z-10 transform transition-all duration-300 hover:shadow-purple-500/20">
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
      </>
    );
  }

  if (status?.creatorStatus === "rejected") {
    return (
      <>
        <DashboardNav userRole={userRole} />
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
          <div className="max-w-md w-full space-y-8 p-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 relative z-10 transform transition-all duration-300 hover:shadow-red-500/20">
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
              <p className="text-sm leading-relaxed">
                Your previous application was not approved. You can reapply
                below.
              </p>
            </div>
            <div className="text-center space-y-5">
              <p className="text-sm text-white/70 leading-relaxed">
                Please review your information and submit a new application.
              </p>
              <button
                onClick={() => setStatus(null)}
                className="w-full px-6 py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <span className="flex items-center justify-center space-x-2">
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
                  <span>Reapply Now</span>
                </span>
              </button>
              <div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 text-white/80 hover:text-white font-medium transition-colors hover:underline"
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
      </>
    );
  }

  return (
    <>
      <DashboardNav userRole={userRole} />
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        <div className="max-w-md w-full space-y-8 p-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 relative z-10 transform transition-all duration-300 hover:shadow-purple-500/20">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 p-1 shadow-lg shadow-pink-500/30 animate-pulse">
              <div className="w-full h-full rounded-full bg-linear-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-white drop-shadow-lg"
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
            <h2 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg">
              Become a Creator
            </h2>
            <p className="text-white/90 text-lg font-medium">
              Apply to start monetizing your content
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-linear-to-r from-red-500/20 to-red-600/20 border border-red-400/40 text-red-100 px-5 py-4 rounded-2xl backdrop-blur-sm flex items-center space-x-3 shadow-lg animate-shake">
                <svg
                  className="w-6 h-6 text-red-300 shrink-0"
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
                <p className="font-semibold">{error}</p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="displayName"
                  className="flex items-center space-x-2 text-sm font-bold text-white mb-3"
                >
                  <div className="p-1.5 rounded-lg bg-purple-500/20">
                    <svg
                      className="w-4 h-4 text-purple-300"
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
                  <span>Display Name *</span>
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 block w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 text-white placeholder-white/50 transition-all duration-300 hover:bg-white/15 hover:border-white/30"
                  placeholder="Your creator name"
                  maxLength={255}
                />
                <p className="mt-2 text-xs text-white/60 flex items-center space-x-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>This will be your public creator name</span>
                </p>
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="flex items-center space-x-2 text-sm font-bold text-white mb-3"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/20">
                    <svg
                      className="w-4 h-4 text-blue-300"
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
                  </div>
                  <span>Bio (Optional)</span>
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 block w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 text-white placeholder-white/50 transition-all duration-300 resize-none hover:bg-white/15 hover:border-white/30"
                  placeholder="Tell fans about yourself..."
                />
              </div>
            </div>

            <div className="bg-linear-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/40 text-blue-100 px-6 py-5 rounded-2xl backdrop-blur-sm shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/30">
                  <svg
                    className="w-6 h-6 text-blue-200"
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
                </div>
                <p className="font-bold text-lg">What happens next?</p>
              </div>
              <ul className="space-y-2.5 ml-2">
                <li className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-blue-300 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Your application will be reviewed</span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-blue-300 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    You&apos;ll need to complete identity verification
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-blue-300 mt-0.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Once approved, you can start monetizing</span>
                </li>
              </ul>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center space-x-3 py-4 px-6 border border-transparent rounded-xl shadow-xl text-base font-bold text-white bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 active:scale-95 disabled:transform-none"
              >
                {isLoading ? (
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
                    <span>Submitting...</span>
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
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 text-white/70 hover:text-white font-medium transition-all duration-300 hover:underline"
              >
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
                <span>Cancel</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

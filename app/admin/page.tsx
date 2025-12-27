import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";

export default async function AdminPage() {
  const user = await getCurrentUser();

  // Check if user is authenticated and is admin
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  // Get platform stats
  const [
    usersCount,
    creatorsCount,
    pendingCreators,
    postsCount,
    transactionsCount,
  ] = await Promise.all([
    db.query("SELECT COUNT(*) as count FROM users"),
    db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'creator' AND creator_status = 'approved'"
    ),
    db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'creator' AND creator_status = 'pending'"
    ),
    db.query("SELECT COUNT(*) as count FROM posts WHERE is_disabled = false"),
    db.query(
      "SELECT COUNT(*) as count FROM transactions WHERE status = 'completed'"
    ),
  ]);

  const stats = {
    totalUsers: parseInt(usersCount.rows[0]?.count || "0"),
    approvedCreators: parseInt(creatorsCount.rows[0]?.count || "0"),
    pendingCreators: parseInt(pendingCreators.rows[0]?.count || "0"),
    totalPosts: parseInt(postsCount.rows[0]?.count || "0"),
    totalTransactions: parseInt(transactionsCount.rows[0]?.count || "0"),
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
            Admin Dashboard
          </h1>
          <p className="text-white/80 text-lg font-medium">
            Platform overview and management
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/20">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
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
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.totalUsers}
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Creators
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.approvedCreators}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-yellow-500/20">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
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
                  {stats.pendingCreators}
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-white/70 uppercase tracking-wide">
                  Posts
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.totalPosts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/20">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
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
                  Transactions
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.totalTransactions}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                <svg
                  className="w-6 h-6 text-purple-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Quick Actions</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  href="/admin/creators"
                  className="group block p-5 bg-linear-to-r from-blue-500/20 to-indigo-500/20 border-2 border-blue-400/50 rounded-2xl hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500/30 group-hover:bg-blue-500/40 transition-colors">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-1">
                        Creator Management
                      </h4>
                      <p className="text-sm text-white/70">
                        Review and approve creator applications
                      </p>
                      <div className="mt-2 inline-flex items-center space-x-1 px-2 py-1 bg-yellow-500/30 rounded-lg">
                        <span className="text-xs font-semibold text-yellow-200">
                          {stats.pendingCreators} pending
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/posts"
                  className="group block p-5 bg-linear-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/50 rounded-2xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-purple-500/30 group-hover:bg-purple-500/40 transition-colors">
                      <svg
                        className="w-6 h-6 text-purple-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-1">
                        Content Moderation
                      </h4>
                      <p className="text-sm text-white/70">
                        Manage posts and content
                      </p>
                      <div className="mt-2 inline-flex items-center space-x-1 px-2 py-1 bg-purple-500/30 rounded-lg">
                        <span className="text-xs font-semibold text-purple-200">
                          {stats.totalPosts} posts
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/transactions"
                  className="group block p-5 bg-linear-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-2xl hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-green-500/30 group-hover:bg-green-500/40 transition-colors">
                      <svg
                        className="w-6 h-6 text-green-200"
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
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-1">
                        Transactions
                      </h4>
                      <p className="text-sm text-white/70">
                        View and manage transactions
                      </p>
                      <div className="mt-2 inline-flex items-center space-x-1 px-2 py-1 bg-green-500/30 rounded-lg">
                        <span className="text-xs font-semibold text-green-200">
                          {stats.totalTransactions} total
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/users"
                  className="group block p-5 bg-linear-to-r from-indigo-500/20 to-blue-500/20 border-2 border-indigo-400/50 rounded-2xl hover:from-indigo-500/30 hover:to-blue-500/30 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-indigo-500/30 group-hover:bg-indigo-500/40 transition-colors">
                      <svg
                        className="w-6 h-6 text-indigo-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-1">
                        User Management
                      </h4>
                      <p className="text-sm text-white/70">
                        Manage users and accounts
                      </p>
                      <div className="mt-2 inline-flex items-center space-x-1 px-2 py-1 bg-indigo-500/30 rounded-lg">
                        <span className="text-xs font-semibold text-indigo-200">
                          {stats.totalUsers} users
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
                <svg
                  className="w-6 h-6 text-pink-300"
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
                <span>Recent Activity</span>
              </h2>
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-white/60 font-medium">
                  Activity feed coming soon
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Admin Info */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <svg
                  className="w-6 h-6 text-purple-300"
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
                <span>Admin Account</span>
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1">
                    Email
                  </dt>
                  <dd className="text-sm font-semibold text-white break-all">
                    {user.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1">
                    Role
                  </dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-3 py-1 bg-linear-to-r from-red-500/30 to-red-600/30 border border-red-400/50 text-red-200 rounded-full text-xs font-bold">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {user.role}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1">
                    Member Since
                  </dt>
                  <dd className="text-sm font-semibold text-white">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Platform Health */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
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
                <span>Platform Health</span>
              </h3>
              <dl className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-blue-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                      />
                    </svg>
                    <dt className="text-sm font-medium text-white/80">
                      Database
                    </dt>
                  </div>
                  <dd className="flex items-center space-x-1 text-sm font-bold text-green-300">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Healthy</span>
                  </dd>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-2">
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
                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <dt className="text-sm font-medium text-white/80">API</dt>
                  </div>
                  <dd className="flex items-center space-x-1 text-sm font-bold text-green-300">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Running</span>
                  </dd>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-indigo-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                      />
                    </svg>
                    <dt className="text-sm font-medium text-white/80">
                      Storage
                    </dt>
                  </div>
                  <dd className="flex items-center space-x-1 text-sm font-bold text-green-300">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Available</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

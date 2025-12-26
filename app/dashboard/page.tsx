import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login");
  }

  // Route to role-specific dashboard
  if (user.role === "creator") {
    redirect("/creator/dashboard");
  }

  if (user.role === "admin") {
    redirect("/admin");
  }

  // Fan dashboard (default)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user.email}!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">S</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Subscriptions
                </p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Posts Unlocked
                </p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">M</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Messages</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Feed Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Feed</h2>
                <Link
                  href="/feed"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">No posts yet</p>
                <Link
                  href="/feed"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Browse Feed
                </Link>
              </div>
            </div>

            {/* Subscriptions */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Subscriptions
                </h2>
                <Link
                  href="/subscriptions"
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Manage →
                </Link>
              </div>
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">
                  You&apos;re not subscribed to any creators yet
                </p>
                <Link
                  href="/creators"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Discover Creators
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/feed"
                  className="block w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center font-medium"
                >
                  Browse Feed
                </Link>
                <Link
                  href="/creators"
                  className="block w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 text-center font-medium"
                >
                  Discover Creators
                </Link>
                <Link
                  href="/become-creator"
                  className="block w-full px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 text-center font-medium"
                >
                  Become a Creator
                </Link>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Account
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      {user.role}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Member Since
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="text-center py-4 text-gray-500 text-sm">
                No recent activity
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

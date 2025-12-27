import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-linear-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">FH</span>
            </div>
            <span className="text-2xl font-bold text-white">FanHouse</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-white hover:text-purple-200 transition-colors font-medium"
                >
                  Dashboard
                </Link>
                <form
                  action="/api/auth/logout"
                  method="POST"
                  className="inline"
                >
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-white hover:text-purple-200 transition-colors font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Message for Logged In Users */}
          {user ? (
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                <span className="text-white/90 text-sm font-medium">
                  Welcome back, {user.email}
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Ready to{" "}
                {user.role === "creator"
                  ? "create"
                  : user.role === "admin"
                  ? "manage"
                  : "explore"}
                ?
              </h1>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                {user.role === "creator"
                  ? "Manage your content, connect with fans, and grow your earnings."
                  : user.role === "admin"
                  ? "Manage the platform, review content, and oversee operations."
                  : "Discover amazing creators, subscribe to exclusive content, and support your favorites."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-linear-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Go to Dashboard
                </Link>
                {user.role === "fan" && (
                  <Link
                    href="/creators"
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
                  >
                    Browse Creators
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Hero Content */}
              <div className="text-center mb-20">
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                  Monetize Your
                  <span className="block bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Creative Content
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
                  The platform where creators connect with fans, share exclusive
                  content, and build sustainable income streams.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Link
                    href="/register"
                    className="px-8 py-4 bg-linear-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/creators"
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-all border border-white/20"
                  >
                    Browse Creators
                  </Link>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-8 mb-20">
                {/* For Creators */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="w-14 h-14 bg-linear-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-6">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    For Creators
                  </h3>
                  <ul className="space-y-3 text-white/80">
                    <li className="flex items-start">
                      <span className="text-pink-400 mr-2">✓</span>
                      <span>Monetize your content with subscriptions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-400 mr-2">✓</span>
                      <span>Direct messaging with fans</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-400 mr-2">✓</span>
                      <span>PPV content and tips</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-pink-400 mr-2">✓</span>
                      <span>Transparent earnings dashboard</span>
                    </li>
                  </ul>
                  <Link
                    href="/become-creator"
                    className="mt-6 inline-block text-pink-300 hover:text-pink-200 font-medium"
                  >
                    Become a Creator →
                  </Link>
                </div>

                {/* For Fans */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="w-14 h-14 bg-linear-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    For Fans
                  </h3>
                  <ul className="space-y-3 text-white/80">
                    <li className="flex items-start">
                      <span className="text-purple-400 mr-2">✓</span>
                      <span>Exclusive content from creators</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-400 mr-2">✓</span>
                      <span>Direct messaging with creators</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-400 mr-2">✓</span>
                      <span>Support your favorites</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-400 mr-2">✓</span>
                      <span>Cancel anytime</span>
                    </li>
                  </ul>
                  <Link
                    href="/register"
                    className="mt-6 inline-block text-purple-300 hover:text-purple-200 font-medium"
                  >
                    Join as Fan →
                  </Link>
                </div>

                {/* Platform Features */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="w-14 h-14 bg-linear-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Secure & Safe
                  </h3>
                  <ul className="space-y-3 text-white/80">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">✓</span>
                      <span>Secure payment processing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">✓</span>
                      <span>Identity verification</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">✓</span>
                      <span>Content moderation</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">✓</span>
                      <span>Privacy protection</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Stats Section */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-20">
                <div className="grid md:grid-cols-4 gap-8 text-center">
                  <div>
                    <div className="text-4xl font-bold text-white mb-2">
                      80%
                    </div>
                    <div className="text-white/70">Creator Earnings</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-2">
                      24/7
                    </div>
                    <div className="text-white/70">Support</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-2">
                      100%
                    </div>
                    <div className="text-white/70">Secure</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-white mb-2">∞</div>
                    <div className="text-white/70">Possibilities</div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-xl text-white/80 mb-8">
                  Join thousands of creators and fans already on FanHouse
                </p>
                <Link
                  href="/register"
                  className="inline-block px-10 py-5 bg-linear-to-r from-pink-500 to-purple-600 text-white rounded-lg font-bold text-xl hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-2xl"
                >
                  Create Your Account
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-white/10 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center text-white/60 text-sm">
          <div className="mb-4 md:mb-0">
            © {new Date().getFullYear()} FanHouse. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link
              href="/creators"
              className="hover:text-white transition-colors"
            >
              Creators
            </Link>
            <Link href="/feed" className="hover:text-white transition-colors">
              Feed
            </Link>
            {!user && (
              <Link
                href="/login"
                className="hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface AuthNavProps {
  user?: {
    id: string;
    email: string;
    role: 'fan' | 'creator' | 'admin';
  } | null;
}

export default function AuthNav({ user }: AuthNavProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  return (
    <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-linear-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">FH</span>
          </div>
          <span className="text-2xl font-bold text-white">FanHouse</span>
        </Link>
        
        <div className="hidden sm:flex items-center space-x-4">
          {user ? (
            <>
              {/* Authenticated Navigation */}
              {user.role === 'fan' && (
                <>
                  <Link
                    href="/feed"
                    className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/feed')
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Feed
                  </Link>
                  <Link
                    href="/creators"
                    className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/creators')
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Creators
                  </Link>
                  <Link
                    href="/subscriptions"
                    className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/subscriptions')
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Subscriptions
                  </Link>
                  <Link
                    href="/messages"
                    className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/messages')
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Messages
                  </Link>
                </>
              )}
              {user.role === 'creator' && (
                <>
                  <Link
                    href="/creator/dashboard"
                    className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/creator')
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Creator Dashboard
                  </Link>
                  <Link
                    href="/creators"
                    className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/creators')
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Browse
                  </Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link
                    href="/admin"
                    className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                      isActive('/admin')
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Admin
                  </Link>
                </>
              )}
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  isActive('/dashboard')
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Dashboard
              </Link>
              <form action="/api/auth/logout" method="POST" className="inline">
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
              {/* Unauthenticated Navigation */}
              <Link
                href="/"
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  pathname === '/'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Home
              </Link>
              <Link
                href="/creators"
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  pathname === '/creators'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Creators
              </Link>
              <Link
                href="/login"
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  pathname === '/login'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
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

        {/* Mobile menu button */}
        <div className="sm:hidden flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center justify-center p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? (
              <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden mt-4 pb-4 border-t border-white/10">
          <div className="pt-4 space-y-2">
            {user ? (
              <>
                {user.role === 'fan' && (
                  <>
                    <Link
                      href="/feed"
                      onClick={() => setIsMenuOpen(false)}
                      className={`block px-4 py-2 rounded-lg text-base font-medium ${
                        isActive('/feed')
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      Feed
                    </Link>
                    <Link
                      href="/creators"
                      onClick={() => setIsMenuOpen(false)}
                      className={`block px-4 py-2 rounded-lg text-base font-medium ${
                        isActive('/creators')
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      Creators
                    </Link>
                    <Link
                      href="/subscriptions"
                      onClick={() => setIsMenuOpen(false)}
                      className={`block px-4 py-2 rounded-lg text-base font-medium ${
                        isActive('/subscriptions')
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      Subscriptions
                    </Link>
                    <Link
                      href="/messages"
                      onClick={() => setIsMenuOpen(false)}
                      className={`block px-4 py-2 rounded-lg text-base font-medium ${
                        isActive('/messages')
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      Messages
                    </Link>
                  </>
                )}
                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-base font-medium ${
                    isActive('/dashboard')
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </Link>
                <form action="/api/auth/logout" method="POST" className="px-4 py-2">
                  <button
                    type="submit"
                    className="block w-full text-left text-white/80 hover:text-white"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-base font-medium ${
                    pathname === '/'
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/creators"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-base font-medium ${
                    pathname === '/creators'
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  Creators
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-base font-medium ${
                    pathname === '/login'
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-base font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}


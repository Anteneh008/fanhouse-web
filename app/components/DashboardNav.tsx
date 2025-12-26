'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface DashboardNavProps {
  userRole: 'fan' | 'creator' | 'admin';
}

export default function DashboardNav({ userRole }: DashboardNavProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  // Fan navigation
  const fanNav = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Feed', href: '/feed' },
    { name: 'Creators', href: '/creators' },
    { name: 'Subscriptions', href: '/subscriptions' },
    { name: 'Messages', href: '/messages' },
  ];

  // Creator navigation
  const creatorNav = [
    { name: 'Dashboard', href: '/creator/dashboard' },
    { name: 'Posts', href: '/creator/posts' },
    { name: 'Earnings', href: '/creator/earnings' },
    { name: 'Subscribers', href: '/creator/subscribers' },
    { name: 'Messages', href: '/creator/messages' },
  ];

  // Admin navigation
  const adminNav = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Creators', href: '/admin/creators' },
    { name: 'Posts', href: '/admin/posts' },
    { name: 'Transactions', href: '/admin/transactions' },
    { name: 'Users', href: '/admin/users' },
  ];

  const navItems = userRole === 'admin' ? adminNav : userRole === 'creator' ? creatorNav : fanNav;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                FanHouse
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.href)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
              >
                Sign Out
              </button>
            </form>
          </div>
          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
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
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(item.href)
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <form action="/api/auth/logout" method="POST" className="pl-3 pr-4 py-2">
              <button
                type="submit"
                className="block w-full text-left text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}


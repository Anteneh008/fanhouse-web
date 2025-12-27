"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface DashboardNavProps {
  userRole: "fan" | "creator" | "admin";
}

export default function DashboardNav({ userRole }: DashboardNavProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  // Fan navigation
  const fanNav = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Feed", href: "/feed" },
    { name: "Creators", href: "/creators" },
    { name: "Subscriptions", href: "/subscriptions" },
    { name: "Messages", href: "/messages" },
  ];

  // Creator navigation
  const creatorNav = [
    { name: "Dashboard", href: "/creator/dashboard" },
    { name: "Posts", href: "/creator/posts" },
    { name: "Earnings", href: "/creator/earnings" },
    { name: "Subscribers", href: "/creator/subscribers" },
    { name: "Messages", href: "/creator/messages" },
  ];

  // Admin navigation
  const adminNav = [
    { name: "Dashboard", href: "/admin" },
    { name: "Creators", href: "/admin/creators" },
    { name: "Posts", href: "/admin/posts" },
    { name: "Transactions", href: "/admin/transactions" },
    { name: "Payouts", href: "/admin/payouts" },
    { name: "Users", href: "/admin/users" },
  ];

  const navItems =
    userRole === "admin"
      ? adminNav
      : userRole === "creator"
      ? creatorNav
      : fanNav;

  return (
    <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="shrink-0 flex items-center">
              <Link
                href="/"
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-linear-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">FH</span>
                </div>
                <span className="text-xl font-bold bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  FanHouse
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    isActive(item.href)
                      ? "bg-white/20 text-white shadow-lg border border-white/30"
                      : "text-white/70 hover:text-white hover:bg-white/10 border border-transparent"
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
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold border border-white/20 transition-all duration-300 hover:border-white/30"
              >
                Sign Out
              </button>
            </form>
          </div>
          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
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
              ) : (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden border-t border-white/20 bg-white/5 backdrop-blur-sm">
          <div className="pt-2 pb-3 space-y-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-300 ${
                  isActive(item.href)
                    ? "bg-white/20 text-white shadow-lg border border-white/30"
                    : "text-white/70 hover:text-white hover:bg-white/10 border border-transparent"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <form action="/api/auth/logout" method="POST" className="px-4 py-2">
              <button
                type="submit"
                className="block w-full text-left px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-base font-semibold border border-white/20 transition-all duration-300"
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

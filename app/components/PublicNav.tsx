'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PublicNav() {
  const pathname = usePathname();

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
        <div className="flex items-center space-x-4">
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
            className={`px-4 py-2 rounded-lg transition-colors font-medium ${
              pathname === '/register'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}


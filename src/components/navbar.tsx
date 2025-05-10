'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 w-full bg-white/10 backdrop-blur-md border-b border-white/20 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/agroxx.png"
                alt="AgroX Logo"
                width={80}
                height={60}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-12">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-lg font-semibold
                ${isActive('/dashboard') 
                  ? 'text-emerald-700' 
                  : 'text-emerald-700'}`}
            >
              <span className="text-lg"></span>
              <span>Dashboard</span>
            </Link>

            <Link
              href="/node-page"
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-lg font-semibold
                ${isActive('/node-page') 
                  ? 'text-emerald-700' 
                  : 'text-emerald-700'}`}
            >
              <span className="text-lg"></span>
              <span>Nodes</span>
            </Link>

            <Link
              href="/reward"
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-lg font-semibold
                ${isActive('/reward') 
                  ? 'text-emerald-700' 
                  : 'text-emerald-700'}`}
            >
              <span className="text-lg"></span>
              <span>Rewards</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

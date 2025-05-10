'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { WalletConnectButton } from './wallet-connect-button';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="fixed top-0 w-full bg-white/10 backdrop-blur-md border-b border-white/20 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-24">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/agroxx.png"
                alt="AgroX Logo"
                width={80}
                height={60}
                className="object-contain w-16 md:w-20"
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8 lg:space-x-12">
            <Link
              href="/dashboard"
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-base lg:text-lg font-semibold transition-colors duration-200
                ${isActive('/dashboard') 
                  ? 'text-emerald-700' 
                  : 'text-emerald-700 hover:text-emerald-800'}`}
            >
              <span>Dashboard</span>
            </Link>

            <Link
              href="/node-page"
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-base lg:text-lg font-semibold transition-colors duration-200
                ${isActive('/node-page') 
                  ? 'text-emerald-700' 
                  : 'text-emerald-700 hover:text-emerald-800'}`}
            >
              <span>Nodes</span>
            </Link>

            <Link
              href="/reward"
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-base lg:text-lg font-semibold transition-colors duration-200
                ${isActive('/reward') 
                  ? 'text-emerald-700' 
                  : 'text-emerald-700 hover:text-emerald-800'}`}
            >
              <span>Rewards</span>
            </Link>
          </div>

          {/* Desktop Wallet Connect */}
          <div className="hidden md:block">
            <WalletConnectButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <WalletConnectButton className="!scale-75" />
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-emerald-700 hover:text-emerald-800 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/5 backdrop-blur-md rounded-lg mt-2 mb-4">
              <Link
                href="/dashboard"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
                  ${isActive('/dashboard') 
                    ? 'text-emerald-700 bg-emerald-50' 
                    : 'text-emerald-700 hover:bg-emerald-50'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>

              <Link
                href="/node-page"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
                  ${isActive('/node-page') 
                    ? 'text-emerald-700 bg-emerald-50' 
                    : 'text-emerald-700 hover:bg-emerald-50'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Nodes
              </Link>

              <Link
                href="/reward"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200
                  ${isActive('/reward') 
                    ? 'text-emerald-700 bg-emerald-50' 
                    : 'text-emerald-700 hover:bg-emerald-50'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Rewards
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

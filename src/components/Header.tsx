'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import UserMenu from '@/components/UserMenu';

interface HeaderProps {
  showBackButton?: boolean;
  backUrl?: string;
  backLabel?: string;
}

export default function Header({ showBackButton = false, backUrl = '/', backLabel = 'Back' }: HeaderProps) {
  const { isAuthenticated, user } = useUser();
  
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-4 mb-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          {/* Logo and App Name */}
          <Link href="/" className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-3 shadow-sm">
              D
            </div>
            <h1 className="text-xl font-bold text-gray-900">DecentraNet</h1>
          </Link>
          
          {/* Back Button - only show if requested */}
          {showBackButton && (
            <Link 
              href={backUrl} 
              className="ml-6 text-purple-600 hover:text-purple-800 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              {backLabel}
            </Link>
          )}
        </div>
        
        {/* User Menu */}
        <div className="flex items-center">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
} 
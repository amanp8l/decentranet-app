'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import Link from 'next/link';

export default function UserMenu() {
  const { user, logout } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 rounded-full hover:bg-gray-100 p-1 transition-colors"
      >
        <div className="h-8 w-8 rounded-full overflow-hidden bg-purple-200 flex items-center justify-center">
          {user.pfp ? (
            <Image
              src={user.pfp}
              alt={user.displayName || user.username || String(user.fid)}
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <span className="text-purple-700 font-bold text-sm">
              {(user.displayName || user.username || String(user.fid)).substring(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <span className="text-sm font-medium hidden md:block">
          {user.displayName || user.username || `User ${user.fid}`}
        </span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md border border-gray-200 z-10">
          <div className="p-3 border-b border-gray-100">
            <p className="font-medium">{user.displayName || user.username}</p>
            <p className="text-xs text-gray-500">FID: {user.fid}</p>
          </div>
          <ul className="py-1">
            <li>
              <Link
                href={`/profile/${user.fid}`}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                My Profile
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors"
              >
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
} 
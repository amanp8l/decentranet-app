'use client';

import { useUser } from '@/context/UserContext';
import Image from 'next/image';

export default function UserProfile() {
  const { user, logout } = useUser();

  if (!user) return null;

  // Display different connection badges based on provider
  const connectionBadge = () => {
    switch(user.provider) {
      case 'farcaster':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"></path>
            </svg>
            Warpcast
          </span>
        );
      case 'wallet':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 7h-1V6c0-1.1-.9-2-2-2H8C6.9 4 6 4.9 6 6v1H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-3 0H8V6h8v1zM5 9h14v8H5V9z"></path>
            </svg>
            {user.walletData?.ensName || `${user.walletData?.address?.substring(0, 6)}...${user.walletData?.address?.substring(38)}`}
          </span>
        );
      case 'hubble':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h-3L15 21l4-3.99h-3z"></path>
            </svg>
            Hubble Node
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center mb-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 mr-3">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.username}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-xl">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="font-bold mr-2">{user.displayName || user.username}</h3>
            {connectionBadge()}
          </div>
          <p className="text-sm text-gray-500">@{user.username}</p>
        </div>
      </div>
      
      {user.bio && (
        <div className="mb-3 text-sm text-gray-600">
          {user.bio}
        </div>
      )}
      
      <div className="flex space-x-4 mb-3 text-sm">
        <div>
          <span className="font-semibold text-gray-900">{user.following || 0}</span>{" "}
          <span className="text-gray-600">Following</span>
        </div>
        <div>
          <span className="font-semibold text-gray-900">{user.followers || 0}</span>{" "}
          <span className="text-gray-600">Followers</span>
        </div>
        <div>
          <span className="font-semibold text-gray-900">{user.fid}</span>{" "}
          <span className="text-gray-600">FID</span>
        </div>
      </div>
      
      <div className="border-t border-gray-100 pt-3 mt-2">
        <div className="flex text-sm text-gray-500">
          <span className="mr-2">Connected via:</span>
          <span className="text-purple-600 font-medium capitalize">{user.provider}</span>
        </div>
        
        {user.authToken && (
          <div className="mt-1 text-xs text-gray-400 truncate">
            Token: {user.authToken.substring(0, 10)}...
          </div>
        )}
        
        <button
          onClick={logout}
          className="mt-3 w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
} 
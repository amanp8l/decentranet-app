'use client';

import Image from 'next/image';
import { UserStats as UserStatsType } from '@/types/social';
import UserStats from './UserStats';

interface UserCardProps {
  fid: number;
  username?: string;
  displayName?: string;
  pfp?: string | null;
  bio?: string;
  stats?: UserStatsType;
  onViewProfile?: (fid: number) => void;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  followLoading?: boolean;
  compact?: boolean;
  showStats?: boolean;
}

export default function UserCard({
  fid,
  username,
  displayName,
  pfp,
  bio,
  stats,
  onViewProfile,
  isFollowing,
  onFollowToggle,
  followLoading = false,
  compact = false,
  showStats = true
}: UserCardProps) {
  
  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(fid);
    }
  };
  
  if (compact) {
    return (
      <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={handleViewProfile}>
        <div className={`rounded-full overflow-hidden bg-gray-100 flex-shrink-0 relative ${compact ? 'w-10 h-10 mr-3' : 'w-16 h-16 mr-4'}`}>
          {pfp ? (
            <Image 
              src={pfp} 
              alt={username || `FID: ${fid}`}
              width={compact ? 40 : 64}
              height={compact ? 40 : 64}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-lg">
              {(username?.charAt(0) || fid.toString().charAt(0)).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{displayName || username || `User ${fid}`}</div>
          {username && (
            <div className="text-sm text-gray-500 truncate">@{username}</div>
          )}
        </div>
        
        {showStats && stats && (
          <div className="ml-4 text-xs">
            <UserStats fid={fid} stats={stats} showFid={false} />
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-start">
        {/* Avatar */}
        <div 
          className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mr-4 flex-shrink-0 relative cursor-pointer"
          onClick={handleViewProfile}
        >
          {pfp ? (
            <Image 
              src={pfp} 
              alt={username || `FID: ${fid}`}
              width={64}
              height={64}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-lg">
              {(username?.charAt(0) || fid.toString().charAt(0)).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 
                className="text-lg font-bold truncate cursor-pointer hover:text-purple-600"
                onClick={handleViewProfile}
              >
                {displayName || username || `User ${fid}`}
              </h2>
              {username && (
                <p className="text-gray-500 truncate">@{username}</p>
              )}
            </div>
            
            {/* Follow/Unfollow Button */}
            {onFollowToggle && (
              <button
                onClick={onFollowToggle}
                disabled={followLoading}
                className={`px-4 py-1 rounded-full font-medium text-sm ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                } disabled:opacity-50`}
              >
                {followLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing
                  </span>
                ) : (
                  isFollowing ? 'Unfollow' : 'Follow'
                )}
              </button>
            )}
          </div>
          
          {/* Bio */}
          {bio && (
            <p className="mt-2 text-gray-700 text-sm line-clamp-2">{bio}</p>
          )}
          
          {/* Stats */}
          {showStats && (
            <div className="mt-3 text-sm">
              <UserStats 
                fid={fid} 
                stats={stats}
                showDetailed={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
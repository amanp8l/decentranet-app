'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import UserCard from './UserCard';
import { UserStats } from '@/types/social';

interface UserItem {
  fid: number;
  username: string;
  displayName?: string;
  pfp?: string;
  bio?: string;
  stats?: UserStats;
}

interface FollowListProps {
  fid: number;
  type: 'followers' | 'following';
  onViewProfile?: (fid: number) => void;
  onClose: () => void;
}

export default function FollowList({ fid, type, onViewProfile, onClose }: FollowListProps) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // First get the list of FIDs this user follows or is followed by
        const endpoint = type === 'following' 
          ? `/api/users/following?fid=${fid}` 
          : `/api/users/followers?fid=${fid}`;
          
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type} list: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || `Failed to fetch ${type} list`);
        }
        
        const fidList = type === 'following' ? data.following : data.followers;
        
        if (!Array.isArray(fidList) || fidList.length === 0) {
          setUsers([]);
          setIsLoading(false);
          return;
        }
        
        // Now fetch details for each user
        const userDetailsPromises = fidList.map(async (targetFid: number) => {
          try {
            const profileResponse = await fetch(`/api/users/${targetFid}`);
            if (!profileResponse.ok) {
              return null;
            }
            
            const profileData = await profileResponse.json();
            
            if (profileData.success && profileData.user) {
              return {
                fid: profileData.user.fid,
                username: profileData.user.username,
                displayName: profileData.user.displayName,
                pfp: profileData.user.pfp,
                bio: profileData.user.bio,
                stats: profileData.user.stats
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching user ${targetFid}:`, error);
            return null;
          }
        });
        
        const userDetails = await Promise.all(userDetailsPromises);
        setUsers(userDetails.filter(Boolean) as UserItem[]);
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        setError(`Could not load ${type} list. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [fid, type]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold capitalize">{type}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-700">
              {error}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500">No {type} to display</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {users.map(user => (
                <li 
                  key={user.fid}
                  className="py-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => onViewProfile && onViewProfile(user.fid)}
                >
                  <UserCard
                    fid={user.fid}
                    username={user.username}
                    displayName={user.displayName}
                    pfp={user.pfp}
                    bio={user.bio}
                    stats={user.stats}
                    onViewProfile={onViewProfile}
                    compact={true}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 
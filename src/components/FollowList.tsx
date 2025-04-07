'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface FollowListProps {
  fid: number;
  type: 'followers' | 'following';
  onViewProfile: (fid: number) => void;
  onClose: () => void;
}

interface UserItem {
  fid: number;
  username: string;
  displayName?: string;
  pfp?: string | null;
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
                pfp: profileData.user.pfp
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
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-700">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-gray-500 p-8">
              {type === 'followers' 
                ? 'This user has no followers yet.' 
                : 'This user is not following anyone yet.'}
            </div>
          ) : (
            <ul className="space-y-3">
              {users.map(user => (
                <li 
                  key={user.fid}
                  className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => {
                    onViewProfile(user.fid);
                    onClose();
                  }}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 mr-3 flex-shrink-0">
                      {user.pfp ? (
                        <Image 
                          src={user.pfp} 
                          alt={user.username}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{user.displayName || user.username}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 
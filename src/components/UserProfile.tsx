'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import CastFeed from './CastFeed';
import FollowList from './FollowList';
import UserStats from './UserStats';

interface UserProfileProps {
  fid: number;
  onBack?: () => void;
  onViewProfile?: (fid: number) => void;
}

export default function UserProfile({ fid, onBack, onViewProfile }: UserProfileProps) {
  const { user, updateFollowingList } = useUser();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowList, setShowFollowList] = useState<'followers' | 'following' | null>(null);

  useEffect(() => {
    // Fetch user profile data
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/users/${fid}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user profile: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.user) {
          setProfileUser(data.user);
          
          // If the user is logged in, check follow status
          if (user) {
            checkFollowStatus(user.fid, fid);
          }
        } else {
          throw new Error(data.error || 'Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Could not load user profile. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [fid, user]);
  
  // Function to check if the current user follows the profile being viewed
  const checkFollowStatus = async (userFid: number, targetFid: number) => {
    try {
      const response = await fetch(`/api/users/follow?userFid=${userFid}&targetFid=${targetFid}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsFollowing(data.isFollowing);
        }
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
      // Fall back to checking the user context's following list
      if (user && user.following) {
        if (Array.isArray(user.following)) {
          setIsFollowing(user.following.includes(targetFid));
        } else if (typeof user.following === 'object' && user.following !== null) {
          const followingArray = (user.following as any[]);
          setIsFollowing(followingArray.some((followedUser: any) => 
            followedUser.fid === targetFid || followedUser.targetFid === targetFid
          ));
        }
      }
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      setError('You must be logged in to follow users');
      return;
    }
    
    setFollowLoading(true);
    
    try {
      const action = isFollowing ? 'unfollow' : 'follow';
      
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.authToken}`
        },
        body: JSON.stringify({
          userFid: user.fid,
          targetFid: fid,
          action
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} user`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const newFollowingState = action === 'follow';
        setIsFollowing(newFollowingState);
        
        // Update the user context with the new following status
        updateFollowingList(fid, newFollowingState);
        
        // Update follower count
        if (profileUser) {
          setProfileUser({
            ...profileUser,
            followers: profileUser.followers + (newFollowingState ? 1 : -1)
          });
        }
      } else {
        throw new Error(data.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setError(`Could not ${isFollowing ? 'unfollow' : 'follow'} this user. Please try again.`);
    } finally {
      setFollowLoading(false);
    }
  };

  // Function to handle profile navigation
  const handleViewProfile = (profileFid: number) => {
    if (onViewProfile) {
      onViewProfile(profileFid);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-700">
        <p>{error || 'User not found'}</p>
        {onBack && (
          <button 
            onClick={onBack}
            className="mt-4 text-sm text-purple-600 hover:text-purple-800"
          >
            ← Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Profile Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-start">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mr-4 flex-shrink-0 relative">
            {profileUser.pfp ? (
              <Image 
                src={profileUser.pfp} 
                alt={profileUser.username || `FID: ${profileUser.fid}`}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-lg">
                {(profileUser.username?.charAt(0) || profileUser.fid.toString().charAt(0)).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold">{profileUser.displayName || profileUser.username || `User ${profileUser.fid}`}</h1>
                {profileUser.username && (
                  <p className="text-gray-500">@{profileUser.username}</p>
                )}
              </div>
              
              {/* Follow/Unfollow Button */}
              {user && user.fid !== profileUser.fid && (
                <button
                  onClick={handleFollowToggle}
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
            {profileUser.bio && (
              <p className="mt-2 text-gray-700">{profileUser.bio}</p>
            )}
            
            {/* Stats */}
            <div className="mt-3 flex space-x-4 text-sm">
              <div>
                <button 
                  onClick={() => profileUser.following > 0 && setShowFollowList('following')}
                  className={`${profileUser.following > 0 ? 'hover:underline cursor-pointer' : ''}`}
                >
                  <span className="font-semibold">{profileUser.following || 0}</span>{' '}
                  <span className="text-gray-500">Following</span>
                </button>
              </div>
              <div>
                <button 
                  onClick={() => profileUser.followers > 0 && setShowFollowList('followers')}
                  className={`${profileUser.followers > 0 ? 'hover:underline cursor-pointer' : ''}`}
                >
                  <span className="font-semibold">{profileUser.followers || 0}</span>{' '}
                  <span className="text-gray-500">Followers</span>
                </button>
              </div>
              
              {/* User Stats Section */}
              <div className="ml-4 border-l border-gray-200 pl-4">
                <UserStats 
                  fid={profileUser.fid} 
                  stats={profileUser.stats} 
                  showDetailed={false}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {/* Back button */}
        {onBack && (
          <button 
            onClick={onBack}
            className="mt-4 text-sm text-purple-600 hover:text-purple-800"
          >
            ← Back to feed
          </button>
        )}
      </div>
      
      {/* Detailed Stats (Optional - can be shown on profile page) */}
      {profileUser.stats && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Activity Stats</h3>
          <UserStats 
            fid={profileUser.fid} 
            stats={profileUser.stats} 
            showFid={false}
            showDetailed={true}
          />
        </div>
      )}
      
      {/* User's Casts Feed */}
      <CastFeed userFid={fid} onViewProfile={handleViewProfile} />
      
      {/* Follow List Modal */}
      {showFollowList && (
        <FollowList
          fid={fid}
          type={showFollowList}
          onViewProfile={handleViewProfile}
          onClose={() => setShowFollowList(null)}
        />
      )}
    </div>
  );
} 
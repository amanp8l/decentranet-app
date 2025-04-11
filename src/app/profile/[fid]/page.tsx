'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { useUser } from '@/context/UserContext';
import UserReputation from '@/components/UserReputation';
import UserStats from '@/components/UserStats';
import Header from '@/components/Header';

export default function ProfilePage({ params }: { params: Promise<{ fid: string }> }) {
  const { user, updateFollowingList } = useUser();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  const unwrappedParams = React.use(params);
  const fid = parseInt(unwrappedParams.fid, 10);
  const isOwnProfile = user && user.fid === fid;
  
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
      // First check from user context's following list (this is most up-to-date after page reload)
      if (user && user.following) {
        if (Array.isArray(user.following)) {
          const isFollowingFromContext = user.following.includes(targetFid);
          setIsFollowing(isFollowingFromContext);
          
          // If we already know we're following from context, we can return early
          if (isFollowingFromContext) {
            return;
          }
        }
      }
      
      // Fall back to API check if needed
      const response = await fetch(`/api/users/follow?userFid=${userFid}&targetFid=${targetFid}`);
      
      if (response.ok) {
        try {
          const data = await response.json();
          if (data && data.success) {
            setIsFollowing(data.isFollowing);
            
            // If the API says we're following but our context doesn't have it,
            // update the context to ensure consistency
            if (data.isFollowing && user && user.following && 
                Array.isArray(user.following) && !user.following.includes(targetFid)) {
              updateFollowingList(targetFid, true);
            }
          }
        } catch (jsonError) {
          console.error('Error parsing follow status JSON:', jsonError);
          // Fall back to context check on JSON parsing error
        }
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };
  
  const handleFollowToggle = async () => {
    if (!user) {
      setError('You must be logged in to follow users');
      return;
    }
    
    setFollowLoading(true);
    setError(null); // Clear any previous errors
    
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
      
      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server response was not JSON: ${await response.text()}`);
      }
      
      // Clone the response before reading
      const clonedResponse = response.clone();
      let data;
      
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        const textResponse = await clonedResponse.text();
        console.error('Raw response:', textResponse);
        throw new Error(`Failed to parse server response as JSON: ${textResponse.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        throw new Error(data?.error || `Failed to ${action} user`);
      }
      
      if (data?.success) {
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
        throw new Error(data?.error || `Failed to ${action} user`);
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      setError(error.message || `Could not ${isFollowing ? 'unfollow' : 'follow'} this user. Please try again.`);
    } finally {
      setFollowLoading(false);
    }
  };
  
  return (
    <>
      <Header showBackButton={true} backUrl="/" backLabel="Back to Home" />
      <div className="max-w-4xl mx-auto px-4">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading profile...</p>
          </div>
        ) : error || !profileUser ? (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-700">
            <p>{error || 'User not found'}</p>
          </div>
        ) : (
          <>
            {/* Profile Header with User Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex items-start">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 mr-6 flex-shrink-0 relative">
                  {profileUser.pfp ? (
                    <Image 
                      src={profileUser.pfp} 
                      alt={profileUser.username || `FID: ${profileUser.fid}`}
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-2xl">
                      {(profileUser.username?.charAt(0) || profileUser.fid.toString().charAt(0)).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* User Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{profileUser.displayName || profileUser.username || `User ${profileUser.fid}`}</h1>
                      {profileUser.username && (
                        <p className="text-gray-500 text-lg">@{profileUser.username}</p>
                      )}
                      <p className="text-gray-500 text-sm mt-1">FID: {profileUser.fid}</p>
                    </div>
                    
                    {/* Profile Action Buttons */}
                    <div className="flex space-x-2">
                      {/* Edit Profile Button (only show on own profile) */}
                      {isOwnProfile && (
                        <Link
                          href={`/profile/edit/${fid}`}
                          className="px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-full font-medium text-sm"
                        >
                          Edit Profile
                        </Link>
                      )}
                      
                      {/* Follow/Unfollow Button */}
                      {user && user.fid !== profileUser.fid && (
                        <button
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          className={`px-4 py-2 rounded-full font-medium text-sm ${
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
                  </div>
                  
                  {/* Bio */}
                  {profileUser.bio && (
                    <div className="mt-3 text-gray-700 bg-gray-50 p-3 rounded-md">
                      <p>{profileUser.bio}</p>
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="mt-4 flex space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-xl">{profileUser.following || 0}</div>
                      <div className="text-gray-500">Following</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-xl">{profileUser.followers || 0}</div>
                      <div className="text-gray-500">Followers</div>
                    </div>
                    
                    {/* User Stats Section */}
                    {profileUser.stats && (
                      <div className="ml-4 border-l border-gray-200 pl-6">
                        <UserStats 
                          fid={profileUser.fid} 
                          stats={profileUser.stats} 
                          showDetailed={false}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
            </div>
            
            {/* Reputation Section Title */}
            <div className="border-b border-gray-200 mb-6">
              <h2 className="text-xl font-bold text-gray-900 pb-4">Research Reputation</h2>
            </div>
            
            {/* Research Reputation */}
            <UserReputation fid={fid} />
            
            {/* Call to Action for own profile */}
            {isOwnProfile && (
              <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="text-lg font-medium text-purple-800 mb-2">Enhance Your Research Reputation</h3>
                <p className="text-purple-700 mb-4">
                  Contribute to the DeSci ecosystem by submitting research, reviewing others' work, and verifying your credentials.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/research/contribute"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Submit Research
                  </Link>
                  <Link
                    href="/research"
                    className="px-4 py-2 bg-white text-purple-600 border border-purple-300 rounded-md hover:bg-purple-50"
                  >
                    Review Research
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
} 
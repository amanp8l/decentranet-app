'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';

interface CastData {
  text: string;
  mentions: number[];
  mentionsPositions: number[];
  embeds: any[];
  timestamp: number;
  author?: {
    username: string;
    displayName?: string;
    pfp?: string;
  };
}

interface Cast {
  fid: number;
  data: CastData;
}

interface CastFeedProps {
  userFid?: number;
}

export default function CastFeed({ userFid }: CastFeedProps = {}) {
  const { user } = useUser();
  const [casts, setCasts] = useState<Cast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedTitle, setFeedTitle] = useState("Recent Casts");
  const [viewingFid, setViewingFid] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'following'>('recent');

  useEffect(() => {
    // Set the viewing FID when the userFid prop changes
    setViewingFid(userFid ?? null);
    
    // Update feed title based on whether we're viewing a specific user
    if (userFid) {
      setFeedTitle(`User Feed (FID: ${userFid})`);
      setActiveTab('recent'); // Reset to recent tab when viewing a specific user
    } else {
      setFeedTitle(activeTab === 'following' ? "Following Feed" : "Recent Casts");
    }
    
    // Fetch casts whenever the userFid changes
    fetchCasts();
  }, [userFid, activeTab]);

  // Function to fetch casts
  const fetchCasts = useCallback(async () => {
    setIsLoading(true);
    
    try {
      let endpoint = '/api/casts';
      
      // If viewing a specific user's feed
      if (viewingFid) {
        endpoint += `?fid=${viewingFid}`;
      } 
      // If viewing the following feed
      else if (activeTab === 'following' && user) {
        endpoint = `/api/casts/following?fid=${user.fid}`;
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch casts: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setCasts(data.data);
      } else {
        console.error('Invalid response format:', data);
        setCasts([]);
      }
    } catch (error) {
      console.error('Error fetching casts:', error);
      setCasts([]);
    } finally {
      setIsLoading(false);
    }
  }, [viewingFid, activeTab, user]);

  // Fetch casts when the component mounts or when dependencies change
  useEffect(() => {
    fetchCasts();
  }, [fetchCasts]);
  
  // Listen for feed-update events
  useEffect(() => {
    const handleFeedUpdate = () => {
      fetchCasts();
    };
    
    window.addEventListener('feed-update', handleFeedUpdate);
    
    return () => {
      window.removeEventListener('feed-update', handleFeedUpdate);
    };
  }, [fetchCasts]);

  // Function to switch between tabs
  const switchTab = (tab: 'recent' | 'following') => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      setFeedTitle(tab === 'following' ? "Following Feed" : "Recent Casts");
    }
  };
  
  // Function to view a specific user's feed
  const viewUserFeed = (fid: number) => {
    setViewingFid(fid);
    setFeedTitle(`User Feed (FID: ${fid})`);
    
    // Update the URL to reflect the user we're viewing
    const url = new URL(window.location.href);
    url.searchParams.set('view', fid.toString());
    window.history.pushState({}, '', url);
    
    // Fetch the user's casts
    fetchCasts();
  };
  
  // Function to return to the main feed
  const viewMainFeed = () => {
    setViewingFid(null);
    setFeedTitle("Recent Casts");
    
    // Remove the view parameter from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    window.history.pushState({}, '', url);
    
    // Fetch main feed
    fetchCasts();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{feedTitle}</h2>
          {viewingFid && (
            <button 
              onClick={viewMainFeed}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              ← Back to main feed
            </button>
          )}
        </div>
        <button 
          onClick={fetchCasts}
          className="text-sm text-purple-600 hover:text-purple-800"
        >
          Refresh
        </button>
      </div>
      
      {/* Feed Type Tabs - Only show when not viewing a specific user */}
      {!viewingFid && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => switchTab('recent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recent'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent
            </button>
            
            {user && ( // Only show Following tab if user is logged in
              <button
                onClick={() => switchTab('following')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'following'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Following
              </button>
            )}
          </nav>
        </div>
      )}
      
      {/* Login prompt for Following tab when not logged in */}
      {!user && activeTab === 'following' && (
        <div className="bg-amber-50 p-3 rounded text-amber-700 text-sm mb-4">
          Please log in to see posts from users you follow.
        </div>
      )}
      
      {isLoading && casts.length === 0 && (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading casts...</p>
        </div>
      )}
      
      {isLoading && casts.length > 0 && (
        <div className="bg-blue-50 p-2 rounded text-center text-blue-700 text-sm mb-4">
          Refreshing...
        </div>
      )}
      
      {error && (
        <div className="bg-amber-50 p-3 rounded text-amber-700 text-sm mb-4">
          {error} <button onClick={fetchCasts} className="underline ml-2">Try again</button>
        </div>
      )}
      
      {!isLoading && casts.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-2">
            {activeTab === 'following' 
              ? "No posts from users you follow yet" 
              : "No casts found"}
          </p>
          
          {activeTab === 'following' && (
            <p className="text-sm text-gray-400">
              Follow more users to see their posts here!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {casts.map((cast, index) => (
            <div key={index} className="border border-gray-200 p-4 rounded-lg shadow-sm">
              <div className="flex items-start mb-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 mr-2 flex-shrink-0 relative">
                  {cast.data.author?.pfp ? (
                    <Image 
                      src={cast.data.author.pfp} 
                      alt={cast.data.author.username || `FID: ${cast.fid}`}
                      width={32}
                      height={32}
                      className="object-cover"
                      onError={(e) => {
                        // If image fails to load, show a fallback
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-xs';
                          fallback.textContent = (cast.data.author?.username?.charAt(0) || cast.fid.toString().charAt(0)).toUpperCase();
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-xs">
                      {cast.data.author?.username?.charAt(0)?.toUpperCase() || cast.fid.toString().charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <button 
                    onClick={() => !viewingFid && viewUserFeed(cast.fid)}
                    className={`font-medium ${!viewingFid ? 'hover:text-purple-600' : ''}`}
                  >
                    {cast.data.author?.displayName || cast.data.author?.username || `FID: ${cast.fid}`}
                  </button>
                  {cast.data.author?.username && (
                    <p className="text-gray-500 text-xs">@{cast.data.author.username}</p>
                  )}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap">{cast.data?.text || 'No content'}</p>
              <p className="text-gray-500 text-sm mt-2">
                {new Date(typeof cast.data?.timestamp === 'number' && cast.data.timestamp < 10000000000
                  ? cast.data.timestamp * 1000  // Convert seconds to milliseconds if timestamp is in seconds
                  : cast.data?.timestamp || 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
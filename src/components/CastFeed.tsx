'use client';

import { useEffect, useState } from 'react';
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

export default function CastFeed() {
  const { user } = useUser();
  const [casts, setCasts] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCasts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/casts');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch casts:', errorText);
        throw new Error('Failed to load casts from server');
      }
      
      const result = await response.json();

      if (result.success) {
        // Fetch author information for each cast
        const castsWithAuthors = await Promise.all(
          result.data.map(async (cast: Cast) => {
            try {
              if (!cast.fid) {
                return cast;
              }
              
              const authorResponse = await fetch(`/api/users/${cast.fid}`);
              
              if (!authorResponse.ok) {
                console.warn(`Couldn't fetch author for FID ${cast.fid}`, await authorResponse.text());
                return cast;
              }
              
              const authorData = await authorResponse.json();
              
              if (authorData.success && authorData.user) {
                return {
                  ...cast,
                  data: {
                    ...cast.data,
                    author: {
                      username: authorData.user.username,
                      displayName: authorData.user.displayName,
                      pfp: authorData.user.pfp
                    }
                  }
                };
              }
              
              return cast;
            } catch (error) {
              console.error(`Failed to fetch author for cast with FID ${cast.fid}:`, error);
              return cast;
            }
          })
        );
        
        setCasts(castsWithAuthors);
      } else {
        setError(result.error || 'Failed to load casts');
      }
    } catch (err) {
      console.error('Error in fetchCasts:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCasts();
    
    // Refresh casts every 30 seconds
    const interval = setInterval(fetchCasts, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && casts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error && casts.length === 0) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchCasts}
          className="mt-3 px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recent Casts</h2>
        <button 
          onClick={fetchCasts}
          className="text-sm text-purple-600 hover:text-purple-800"
        >
          Refresh
        </button>
      </div>
      
      {loading && casts.length > 0 && (
        <div className="bg-blue-50 p-2 rounded text-center text-blue-700 text-sm mb-4">
          Refreshing...
        </div>
      )}
      
      {error && casts.length > 0 && (
        <div className="bg-amber-50 p-2 rounded text-amber-700 text-sm mb-4">
          {error} <button onClick={fetchCasts} className="underline ml-2">Try again</button>
        </div>
      )}
      
      {casts.length === 0 ? (
        <p className="text-gray-500">No casts found</p>
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
                  <p className="font-medium">
                    {cast.data.author?.displayName || cast.data.author?.username || `FID: ${cast.fid}`}
                  </p>
                  {cast.data.author?.username && (
                    <p className="text-gray-500 text-xs">@{cast.data.author.username}</p>
                  )}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap">{cast.data?.text || 'No content'}</p>
              <p className="text-gray-500 text-sm mt-2">
                {new Date(cast.data?.timestamp || 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
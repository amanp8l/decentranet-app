import type { HubRpcClient } from '@farcaster/hub-nodejs';

// Neynar API key configuration
const NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || '45455345-4F67-4A40-B9B1-05561361662B';
const NEYNAR_API_URL = 'https://api.neynar.com/v2';

// Mock implementation of HubRpcClient interface using Neynar API
class NeynarApiClient implements Partial<HubRpcClient> {
  private apiKey: string;
  
  constructor(apiKey: string = NEYNAR_API_KEY) {
    this.apiKey = apiKey;
  }
  
  async getCastsByFid(params: { fid: number; pageSize: number }): Promise<{ messages: any[] }> {
    try {
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/casts?fid=${params.fid}&limit=${params.pageSize}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      // Transform Neynar response to match Hubble response format
      return {
        messages: data.casts || []
      };
    } catch (error) {
      console.error('Error fetching casts from Neynar:', error);
      return { messages: [] };
    }
  }
  
  async close(): Promise<void> {
    // No-op for Neynar API
    return;
  }
}

let client: HubRpcClient | NeynarApiClient | null = null;

// Check if Neynar API should be used
const isUsingNeynar = (): boolean => {
  return !!process.env.NEXT_PUBLIC_NEYNAR_API_KEY || !!process.env.NEXT_PUBLIC_USE_NEYNAR_API;
};

// Get client based on configuration
export const getHubbleClient = async (): Promise<HubRpcClient | NeynarApiClient> => {
  if (client) {
    return client;
  }
  
  if (isUsingNeynar()) {
    console.log('Using Neynar API client');
    client = new NeynarApiClient();
    return client;
  } else {
    // Import dynamically to avoid issues when Neynar is used
    const { getSSLHubRpcClient } = await import('@farcaster/hub-nodejs');
    const hubUrl = process.env.NEXT_PUBLIC_HUBBLE_GRPC_URL || 'http://localhost:2283';
    client = await getSSLHubRpcClient(hubUrl);
    return client;
  }
};

export const closeHubbleClient = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
  }
};

// Helper functions for Neynar API
export const fetchUserProfileByFid = async (fid: number): Promise<any> => {
  try {
    const response = await fetch(`${NEYNAR_API_URL}/farcaster/user?fid=${fid}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Error fetching user from Neynar:', error);
    return null;
  }
};

// Neynar API wrapper for common operations
export const neynarApi = {
  getCasts: async (fid: number, limit: number = 50): Promise<any[]> => {
    try {
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/casts?fid=${fid}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.casts || [];
    } catch (error) {
      console.error('Error fetching casts from Neynar:', error);
      return [];
    }
  },
  
  getCastByHash: async (hash: string): Promise<any> => {
    try {
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/cast?hash=${hash}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.cast || null;
    } catch (error) {
      console.error('Error fetching cast from Neynar:', error);
      return null;
    }
  },
  
  getReactions: async (castHash: string, reactionType: string = 'like'): Promise<any[]> => {
    try {
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/reactions?castHash=${castHash}&type=${reactionType}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.reactions || [];
    } catch (error) {
      console.error('Error fetching reactions from Neynar:', error);
      return [];
    }
  },
  
  getReplies: async (castHash: string, limit: number = 50): Promise<any[]> => {
    try {
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/casts?reply_to=${castHash}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.casts || [];
    } catch (error) {
      console.error('Error fetching replies from Neynar:', error);
      return [];
    }
  },
  
  getFollowers: async (fid: number, limit: number = 100): Promise<any[]> => {
    try {
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/followers?fid=${fid}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Error fetching followers from Neynar:', error);
      return [];
    }
  },
  
  getFollowing: async (fid: number, limit: number = 100): Promise<any[]> => {
    try {
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/following?fid=${fid}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY
        }
      });
      
      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Error fetching following from Neynar:', error);
      return [];
    }
  },
  
  postCast: async (fid: number, text: string, embeds: any[] = [], parent?: { fid: number, hash: string }): Promise<any> => {
    try {
      const payload: any = {
        signer_uuid: `user-${fid}`, // Using fid as UUID for simplicity
        text: text,
        embeds: embeds || []
      };
      
      // Add parent reference for replies
      if (parent && parent.hash) {
        payload.parent = {
          hash: parent.hash
        };
      }
      
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/cast`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Neynar API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error posting cast to Neynar:', error);
      throw error;
    }
  },
  
  reactToCast: async (fid: number, castHash: string, reactionType: 'like' | 'recast'): Promise<any> => {
    try {
      const endpoint = reactionType === 'like' ? 'like' : 'recast';
      
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/cast/${castHash}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          signer_uuid: `user-${fid}`
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Neynar API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error ${reactionType === 'like' ? 'liking' : 'recasting'} cast with Neynar:`, error);
      throw error;
    }
  },
  
  removeReaction: async (fid: number, castHash: string, reactionType: 'like' | 'recast'): Promise<any> => {
    try {
      const endpoint = reactionType === 'like' ? 'like' : 'recast';
      
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/cast/${castHash}/${endpoint}`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          signer_uuid: `user-${fid}`
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Neynar API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error removing ${reactionType} with Neynar:`, error);
      throw error;
    }
  },
  
  follow: async (followerFid: number, targetFid: number): Promise<any> => {
    try {
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/user/follow`, {
        method: 'PUT',
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          signer_uuid: `user-${followerFid}`,
          target_fid: targetFid
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Neynar API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error following user with Neynar:', error);
      throw error;
    }
  },
  
  unfollow: async (followerFid: number, targetFid: number): Promise<any> => {
    try {
      const response = await fetch(`${NEYNAR_API_URL}/farcaster/user/follow`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'api_key': NEYNAR_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          signer_uuid: `user-${followerFid}`,
          target_fid: targetFid
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Neynar API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error unfollowing user with Neynar:', error);
      throw error;
    }
  }
}; 
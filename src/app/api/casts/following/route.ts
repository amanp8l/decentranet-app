import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to local casts and users databases
const CASTS_DB_PATH = path.join(process.cwd(), 'data', 'casts.json');
const USER_DB_PATH = path.join(process.cwd(), 'data', 'email-users.json');

// Get casts from JSON file
function getLocalCasts() {
  if (!fs.existsSync(CASTS_DB_PATH)) {
    return [];
  }
  try {
    const data = fs.readFileSync(CASTS_DB_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading local casts:', error);
    return [];
  }
}

// Get users from JSON file
function getUsers() {
  if (!fs.existsSync(USER_DB_PATH)) {
    return [];
  }
  try {
    const data = fs.readFileSync(USER_DB_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
}

// Function to fetch user profile data
async function fetchUserProfile(fid: number) {
  try {
    // First check local database
    const users = getUsers();
    const localUser = users.find((u: any) => u.fid === fid);
    
    if (localUser) {
      return {
        username: localUser.username || `user_${fid}`,
        displayName: localUser.displayName || `User ${fid}`,
        pfp: localUser.pfp || null
      };
    }
    
    // If not found locally, try to fetch from API
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    const response = await fetch(`${HUBBLE_HTTP_URL}/v1/userDataByFid?fid=${fid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      if (userData && userData.data) {
        return {
          username: userData.data.username || `user_${fid}`,
          displayName: userData.data.displayName || `User ${fid}`,
          pfp: userData.data.pfp || null
        };
      }
    }
    
    // Fallback if no data is found
    return {
      username: `user_${fid}`,
      displayName: `User ${fid}`,
      pfp: null
    };
  } catch (error) {
    console.error(`Error fetching user profile for FID ${fid}:`, error);
    return {
      username: `user_${fid}`,
      displayName: `User ${fid}`,
      pfp: null
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    
    if (!fid) {
      return NextResponse.json(
        { success: false, error: 'FID is required' },
        { status: 400 }
      );
    }
    
    // First try to get user's following list from local storage
    const users = getUsers();
    const currentUser = users.find((u: any) => u.fid === parseInt(fid));
    
    // Get local casts
    const localCasts = getLocalCasts();
    
    // If we have a local user with following data, use it
    if (currentUser && currentUser.following && Array.isArray(currentUser.following) && currentUser.following.length > 0) {
      const followingFids = currentUser.following;
      
      // Filter local casts by following FIDs
      const followingCasts = localCasts.filter((cast: any) => 
        followingFids.includes(cast.fid) || cast.fid === parseInt(fid)
      );
      
      if (followingCasts.length > 0) {
        // Add author information to each cast
        const castsWithAuthorInfo = await Promise.all(followingCasts.map(async (cast: any) => {
          const authorInfo = await fetchUserProfile(cast.fid);
          return {
            ...cast,
            data: {
              ...cast.data,
              author: authorInfo
            }
          };
        }));
        
        // Sort by timestamp, newest first
        castsWithAuthorInfo.sort((a: any, b: any) => 
          (b.data?.timestamp || 0) - (a.data?.timestamp || 0)
        );
        
        return NextResponse.json({ 
          success: true, 
          data: castsWithAuthorInfo,
          source: 'local'
        });
      }
    }
    
    // First check if the Hubble node is running and accessible
    try {
      const infoResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!infoResponse.ok) {
        throw new Error(`Hubble node not accessible: ${infoResponse.status} ${infoResponse.statusText}`);
      }
    } catch (healthError) {
      console.error('Failed to connect to Hubble node:', healthError);
      
      // If the Hubble node is not accessible, return mock data
      return NextResponse.json({ 
        success: true, 
        data: generateMockCasts(fid) 
      });
    }
    
    // Step 1: Fetch the list of users that this FID is following
    try {
      // First, fetch the following list
      const followingResponse = await fetch(`${request.nextUrl.origin}/api/users/following?fid=${fid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!followingResponse.ok) {
        throw new Error(`Failed to fetch following list: ${followingResponse.status} ${followingResponse.statusText}`);
      }
      
      const followingData = await followingResponse.json();
      
      if (!followingData.success || !Array.isArray(followingData.following) || followingData.following.length === 0) {
        return NextResponse.json({ 
          success: true, 
          data: [] // Empty array if not following anyone
        });
      }
      
      const followingFids = followingData.following;
      console.log(`User ${fid} is following ${followingFids.length} users`);
      
      // Step 2: Fetch recent casts for each followed user
      // We'll fetch batches of casts and combine them
      const castsPromises = followingFids.map(async (followedFid: number) => {
        try {
          const castsResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/castsByFid?fid=${followedFid}&pageSize=10`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (!castsResponse.ok) {
            console.warn(`Failed to fetch casts for FID ${followedFid}`);
            return [];
          }
          
          const castsData = await castsResponse.json();
          
          if (!castsData || !Array.isArray(castsData.messages)) {
            return [];
          }
          
          // Get user profile for this FID
          const authorInfo = await fetchUserProfile(followedFid);
          
          // Transform the cast data to our expected format
          return castsData.messages.map((msg: any) => {
            const castData = msg.data?.castAddBody;
            return {
              fid: msg.data?.fid || 0,
              data: {
                text: castData?.text || '',
                timestamp: msg.data?.timestamp 
                  ? (msg.data.timestamp < 10000000000 ? msg.data.timestamp * 1000 : msg.data.timestamp)
                  : Date.now(),
                mentions: castData?.mentions || [],
                mentionsPositions: castData?.mentionsPositions || [],
                embeds: castData?.embeds || [],
                author: authorInfo
              }
            };
          }).filter((c: any) => c.data.text); // Only include casts with content
        } catch (error) {
          console.error(`Error fetching casts for FID ${followedFid}:`, error);
          return [];
        }
      });
      
      // Wait for all cast fetches to complete
      const castsArrays = await Promise.all(castsPromises);
      
      // Combine all casts into a single array
      let allCasts = castsArrays.flat();
      
      // Sort by timestamp, newest first
      allCasts.sort((a, b) => b.data.timestamp - a.data.timestamp);
      
      // Limit to the most recent 50 casts to avoid overwhelming the UI
      allCasts = allCasts.slice(0, 50);
      
      return NextResponse.json({ 
        success: true, 
        data: allCasts 
      });
    } catch (fetchError) {
      console.error('Error fetching following feed:', fetchError);
      
      // Return mock data if failed
      return NextResponse.json({ 
        success: true, 
        data: generateMockCasts(fid) 
      });
    }
  } catch (error) {
    console.error('Error in following feed API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch following feed. Make sure your Hubble node is running.'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate mock casts for following feed
function generateMockCasts(fid: string): any[] {
  // Generate sample users that this FID might be following
  const followingFids = [2, 3, 1043300, 1002, 1003];
  
  // Generate mock casts from these users with author information
  const mockCasts = [
    {
      fid: 2,
      data: {
        text: "This is a mock cast from a user you're following (FID: 2)",
        timestamp: Date.now() - 30000, // 30 seconds ago
        mentions: [],
        mentionsPositions: [],
        embeds: [],
        author: {
          username: "alice_stellar",
          displayName: "Alice Stellar",
          pfp: null
        }
      }
    },
    {
      fid: 3,
      data: {
        text: "Another mock cast from your following list (FID: 3)",
        timestamp: Date.now() - 1800000, // 30 minutes ago
        mentions: [],
        mentionsPositions: [],
        embeds: [],
        author: {
          username: "bob_crypto",
          displayName: "Bob Crypto",
          pfp: null
        }
      }
    },
    {
      fid: 1043300,
      data: {
        text: "In a real implementation, this would show recent casts from users you follow (FID: 1043300)",
        timestamp: Date.now() - 3600000, // 1 hour ago
        mentions: [],
        mentionsPositions: [],
        embeds: [],
        author: {
          username: "farcaster_team",
          displayName: "Farcaster Team",
          pfp: null
        }
      }
    },
    {
      fid: 1002,
      data: {
        text: "When connected to a Hubble node, you'll see actual casts from your follows (FID: 1002)",
        timestamp: Date.now() - 7200000, // 2 hours ago
        mentions: [],
        mentionsPositions: [],
        embeds: [],
        author: {
          username: "web3_dev",
          displayName: "Web3 Developer",
          pfp: null
        }
      }
    },
    {
      fid: 1003,
      data: {
        text: "This is just sample data while you're not connected to Farcaster (FID: 1003)",
        timestamp: Date.now() - 14400000, // 4 hours ago
        mentions: [],
        mentionsPositions: [],
        embeds: [],
        author: {
          username: "crypto_enthusiast",
          displayName: "Crypto Enthusiast",
          pfp: null
        }
      }
    }
  ];
  
  return mockCasts;
} 
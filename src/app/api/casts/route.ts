import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CastWithSocial } from '@/types/social';

// Path to local casts, users, votes, and comments databases
const CASTS_DB_PATH = path.join(process.cwd(), 'data', 'casts.json');
const USER_DB_PATH = path.join(process.cwd(), 'data', 'email-users.json');
const VOTES_DB_PATH = path.join(process.cwd(), 'data', 'votes.json');
const COMMENTS_DB_PATH = path.join(process.cwd(), 'data', 'comments.json');

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

// Get votes from JSON file
function getVotes() {
  if (!fs.existsSync(VOTES_DB_PATH)) {
    fs.writeFileSync(VOTES_DB_PATH, JSON.stringify({}), 'utf8');
    return {};
  }
  try {
    const data = fs.readFileSync(VOTES_DB_PATH, 'utf8');
    return JSON.parse(data || '{}');
  } catch (error) {
    console.error('Error reading votes:', error);
    return {};
  }
}

// Get comments from JSON file
function getComments() {
  if (!fs.existsSync(COMMENTS_DB_PATH)) {
    fs.writeFileSync(COMMENTS_DB_PATH, JSON.stringify({}), 'utf8');
    return {};
  }
  try {
    const data = fs.readFileSync(COMMENTS_DB_PATH, 'utf8');
    return JSON.parse(data || '{}');
  } catch (error) {
    console.error('Error reading comments:', error);
    return {};
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

// Add social data to casts
function addSocialDataToCasts(casts: any[]) {
  const votes = getVotes();
  const comments = getComments();
  
  return casts.map(cast => {
    const castId = cast.id;
    const castVotes = votes[castId] || [];
    const castComments = comments[castId] || [];
    
    return {
      ...cast,
      votes: castVotes,
      commentCount: castComments.length,
      comments: castComments.map((comment: { id: string }) => comment.id)
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    const limit = parseInt(searchParams.get('limit') || '50');
    const authorInfoByFid = new Map();
    
    // Get local casts
    let localCasts = getLocalCasts();
    
    // Filter by FID if requested
    if (fid) {
      localCasts = localCasts.filter((cast: any) => cast.fid === parseInt(fid));
    }
    
    // Sort by timestamp, newest first
    localCasts.sort((a: any, b: any) => {
      const aTime = a.data?.timestamp || 0;
      const bTime = b.data?.timestamp || 0;
      return bTime - aTime;
    });
    
    // Add author information to each cast
    const castsWithAuthorInfo = [];
    
    for (const cast of localCasts) {
      let authorInfo;
      
      if (authorInfoByFid.has(cast.fid)) {
        authorInfo = authorInfoByFid.get(cast.fid);
      } else {
        authorInfo = await fetchUserProfile(cast.fid);
        authorInfoByFid.set(cast.fid, authorInfo);
      }
      
      castsWithAuthorInfo.push({
        ...cast,
        data: {
          ...cast.data,
          author: authorInfo
        }
      });
    }
    
    // Add social data (votes and comments)
    const castsWithSocialData = addSocialDataToCasts(castsWithAuthorInfo);
    
    // Limit the number of casts returned
    const limitedCasts = castsWithSocialData.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: limitedCasts
    });
  } catch (error) {
    console.error('Error in casts API:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch casts' },
      { status: 500 }
    );
  }
}

// Helper function to generate mock casts
function generateMockCasts(fid: string | null): any[] {
  // If we have a specific FID, generate casts for that user
  if (fid) {
    const fidNum = parseInt(fid);
    // Create author info for this FID
    const authorInfo = {
      username: `user_${fidNum}`,
      displayName: `User ${fidNum}`,
      pfp: null
    };
    
    return [
      {
        fid: fidNum,
        data: {
          text: `This is a mock cast from user with FID: ${fid}`,
          timestamp: Date.now(),
          mentions: [],
          mentionsPositions: [],
          embeds: [],
          author: authorInfo
        }
      },
      {
        fid: fidNum,
        data: {
          text: `Another mock cast from FID: ${fid}. In a real app, this would show actual casts from this user.`,
          timestamp: Date.now() - 60000,
          mentions: [],
          mentionsPositions: [],
          embeds: [],
          author: authorInfo
        }
      },
      {
        fid: fidNum,
        data: {
          text: `Warpcast integration example by FID: ${fid}`,
          timestamp: Date.now() - 120000,
          mentions: [],
          mentionsPositions: [],
          embeds: [],
          author: authorInfo
        }
      }
    ];
  }
  
  // Default mock casts for the feed
  return [
    {
      fid: 1043300,
      data: {
        text: "Welcome to Farcaster Social UI! This is the trending feed.",
        timestamp: Date.now(),
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
        text: "These are the popular posts across the Farcaster network.",
        timestamp: Date.now() - 60000,
        mentions: [],
        mentionsPositions: [],
        embeds: [],
        author: {
          username: "network_updates",
          displayName: "Network Updates",
          pfp: null
        }
      }
    },
    {
      fid: 1003,
      data: {
        text: "You can also view specific user feeds by clicking on their profile.",
        timestamp: Date.now() - 120000,
        mentions: [],
        mentionsPositions: [],
        embeds: [],
        author: {
          username: "guide_bot",
          displayName: "Guide Bot",
          pfp: null
        }
      }
    }
  ];
} 
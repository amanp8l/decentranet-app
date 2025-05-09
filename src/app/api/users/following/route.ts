import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to user database file
const USER_DB_PATH = path.join(process.cwd(), 'data', 'email-users.json');

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    
    if (!fid) {
      return NextResponse.json(
        { success: false, error: 'FID parameter is required' },
        { status: 400 }
      );
    }
    
    const fidNum = parseInt(fid);
    
    if (isNaN(fidNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid FID format' },
        { status: 400 }
      );
    }
    
    // First check if the user exists in our local database
    const users = getUsers();
    const localUser = users.find((u: any) => u.fid === fidNum);
    
    if (localUser && localUser.following && Array.isArray(localUser.following)) {
      return NextResponse.json({
        success: true,
        following: localUser.following,
        count: localUser.following.length
      });
    }
    
    // If not found locally or no following data, try to fetch from Hubble node
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    
    try {
      const response = await fetch(`${HUBBLE_HTTP_URL}/v1/followsByFid?fid=${fid}&limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const followData = await response.json();
        
        if (followData && Array.isArray(followData.followings)) {
          const followingFids = followData.followings.map((follow: any) => follow.targetFid);
          
          return NextResponse.json({
            success: true,
            following: followingFids,
            count: followingFids.length
          });
        }
      }
      
      // Try alternative endpoint
      const altResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/following?fid=${fid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (altResponse.ok) {
        const altData = await altResponse.json();
        
        if (altData && Array.isArray(altData.users)) {
          const followingFids = altData.users.map((u: any) => u.fid);
          
          return NextResponse.json({
            success: true,
            following: followingFids,
            count: followingFids.length
          });
        }
      }
      
      // If no following data found, return empty array
      return NextResponse.json({
        success: true,
        following: [],
        count: 0
      });
    } catch (error) {
      console.error('Error fetching following from Hubble:', error);
      
      // Return empty data if Hubble fetch fails
      return NextResponse.json({
        success: true,
        following: [],
        count: 0
      });
    }
  } catch (error) {
    console.error('Error in following API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch following list' },
      { status: 500 }
    );
  }
}

// Helper function to generate mock following list
function generateMockFollowing(fid: string): number[] {
  // For demo purposes, return a list of mock FIDs
  // In a real implementation, this would be fetched from the Hubble node
  
  // Generate some "random" FIDs based on the user's FID
  const fidNum = parseInt(fid);
  const following = [
    // Some well-known Farcaster accounts
    2, // Varun
    3, // Dan
    // Add some "random" FIDs based on the user's FID
    fidNum + 1000,
    fidNum + 2000,
    fidNum + 3000,
    // Add some fixed FIDs for demonstration
    1043300, // Example FID
    1002,
    1003
  ];
  
  return following;
} 
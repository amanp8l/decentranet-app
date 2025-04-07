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
    
    if (localUser && localUser.followers && Array.isArray(localUser.followers)) {
      return NextResponse.json({
        success: true,
        followers: localUser.followers,
        count: localUser.followers.length
      });
    } else if (localUser) {
      // User exists, but has no followers data
      return NextResponse.json({
        success: true,
        followers: [],
        count: 0
      });
    }
    
    // If not found locally, search for users that follow this FID
    const usersFollowingTarget = users
      .filter((u: any) => 
        u.following && 
        Array.isArray(u.following) && 
        u.following.includes(fidNum)
      )
      .map((u: any) => u.fid);
    
    if (usersFollowingTarget.length > 0) {
      return NextResponse.json({
        success: true,
        followers: usersFollowingTarget,
        count: usersFollowingTarget.length
      });
    }
    
    // If not found locally, try to fetch from Hubble node
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    
    try {
      const response = await fetch(`${HUBBLE_HTTP_URL}/v1/followersByFid?fid=${fid}&limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const followerData = await response.json();
        
        if (followerData && Array.isArray(followerData.followers)) {
          const followerFids = followerData.followers.map((follow: any) => follow.followerFid);
          
          return NextResponse.json({
            success: true,
            followers: followerFids,
            count: followerFids.length
          });
        }
      }
      
      // Try alternative endpoint
      const altResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/followers?fid=${fid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (altResponse.ok) {
        const altData = await altResponse.json();
        
        if (altData && Array.isArray(altData.users)) {
          const followerFids = altData.users.map((u: any) => u.fid);
          
          return NextResponse.json({
            success: true,
            followers: followerFids,
            count: followerFids.length
          });
        }
      }
      
      // If no follower data found, return empty array
      return NextResponse.json({
        success: true,
        followers: [],
        count: 0
      });
    } catch (error) {
      console.error('Error fetching followers from Hubble:', error);
      
      // Return empty data if Hubble fetch fails
      return NextResponse.json({
        success: true,
        followers: [],
        count: 0
      });
    }
  } catch (error) {
    console.error('Error in followers API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch followers list' },
      { status: 500 }
    );
  }
} 
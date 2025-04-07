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

// Save users to JSON file
function saveUsers(users: any[]) {
  // Ensure the data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2));
}

// Follow/unfollow a user
export async function POST(request: NextRequest) {
  try {
    const { userFid, targetFid, action = 'follow' } = await request.json();
    
    if (!userFid || !targetFid) {
      return NextResponse.json(
        { success: false, error: 'Both userFid and targetFid are required' },
        { status: 400 }
      );
    }
    
    // Make sure the FIDs are numbers
    const userFidNum = parseInt(userFid);
    const targetFidNum = parseInt(targetFid);
    
    if (isNaN(userFidNum) || isNaN(targetFidNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid FID format' },
        { status: 400 }
      );
    }
    
    // Check user authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Load users data
    const users = getUsers();
    
    // Find the user making the request
    const user = users.find((u: any) => u.authToken === token && u.fid === userFidNum);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or user not found' },
        { status: 401 }
      );
    }
    
    // Initialize following array if it doesn't exist
    if (!user.following || !Array.isArray(user.following)) {
      user.following = [];
    }
    
    // Find the target user
    const targetUser = users.find((u: any) => u.fid === targetFidNum);
    
    if (targetUser) {
      // Initialize followers array for target user if it doesn't exist
      if (!targetUser.followers || !Array.isArray(targetUser.followers)) {
        targetUser.followers = [];
      }
    }
    
    let message = '';
    
    // Follow or unfollow user
    if (action === 'follow') {
      // Add to following if not already following
      if (!user.following.includes(targetFidNum)) {
        user.following.push(targetFidNum);
        message = `You are now following user with FID ${targetFidNum}`;
        
        // Update target user's followers count if we have that user in our database
        if (targetUser && !targetUser.followers.includes(userFidNum)) {
          targetUser.followers.push(userFidNum);
        }
      } else {
        message = `You are already following user with FID ${targetFidNum}`;
      }
    } else if (action === 'unfollow') {
      // Remove from following
      user.following = user.following.filter((fid: number) => fid !== targetFidNum);
      message = `You have unfollowed user with FID ${targetFidNum}`;
      
      // Update target user's followers if we have that user
      if (targetUser) {
        targetUser.followers = targetUser.followers.filter((fid: number) => fid !== userFidNum);
      }
    }
    
    // Save updated user data
    saveUsers(users);
    
    // Try to follow/unfollow on Hubble node if connected
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    
    try {
      // Check if Hubble node is available
      const infoResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info`, { method: 'GET' });
      
      if (infoResponse.ok) {
        // For Hubble v1.19.1, the following/unfollowing endpoints might be different
        // This is a placeholder for actual Hubble API call
        console.log(`Would send ${action} request to Hubble for user ${userFidNum} to ${action} ${targetFidNum}`);
      }
    } catch (error) {
      // Ignore Hubble connection errors - we've already saved locally
      console.error('Error connecting to Hubble node:', error);
    }
    
    return NextResponse.json({
      success: true,
      message,
      isFollowing: action === 'follow',
      following: user.following.length,
      followers: user.followers?.length || 0
    });
  } catch (error) {
    console.error('Error in follow/unfollow API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process follow/unfollow request' },
      { status: 500 }
    );
  }
}

// Check if a user follows another user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userFid = searchParams.get('userFid');
    const targetFid = searchParams.get('targetFid');
    
    if (!userFid || !targetFid) {
      return NextResponse.json(
        { success: false, error: 'Both userFid and targetFid are required' },
        { status: 400 }
      );
    }
    
    // Make sure the FIDs are numbers
    const userFidNum = parseInt(userFid);
    const targetFidNum = parseInt(targetFid);
    
    if (isNaN(userFidNum) || isNaN(targetFidNum)) {
      return NextResponse.json(
        { success: false, error: 'Invalid FID format' },
        { status: 400 }
      );
    }
    
    // Load users data
    const users = getUsers();
    
    // Find the user
    const user = users.find((u: any) => u.fid === userFidNum);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if the user follows the target
    const isFollowing = user.following && 
                       Array.isArray(user.following) && 
                       user.following.includes(targetFidNum);
    
    return NextResponse.json({
      success: true,
      isFollowing: isFollowing || false
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
} 
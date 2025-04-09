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
  try {
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = parseInt(params.fid);
    
    if (isNaN(fid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid FID format' },
        { status: 400 }
      );
    }
    
    // First check if the user exists in our local database
    const users = getUsers();
    const localUser = users.find((u: any) => u.fid === fid);
    
    if (localUser) {
      // Don't expose sensitive data like password hash
      const safeUser = {
        fid: localUser.fid,
        username: localUser.username,
        displayName: localUser.displayName,
        bio: localUser.bio,
        pfp: localUser.pfp,
        following: localUser.following?.length || 0,
        followers: localUser.followers?.length || 0,
        provider: localUser.provider,
        stats: localUser.stats || {
          postCount: 0,
          commentCount: 0,
          receivedUpvotes: 0,
          receivedDownvotes: 0,
          givenUpvotes: 0,
          givenDownvotes: 0
        }
      };
      
      return NextResponse.json({
        success: true,
        user: safeUser
      });
    }
    
    // If not found locally, try to fetch from Hubble node
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    
    try {
      const response = await fetch(`${HUBBLE_HTTP_URL}/v1/userDataByFid?fid=${fid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Try alternative endpoint
        const altResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info?fid=${fid}`, {
          method: 'GET'
        });
        
        if (!altResponse.ok) {
          throw new Error(`User with FID ${fid} not found`);
        }
        
        const altData = await altResponse.json();
        
        if (altData && altData.user) {
          return NextResponse.json({
            success: true,
            user: {
              fid,
              username: altData.user.username || `user_${fid}`,
              displayName: altData.user.displayName,
              bio: altData.user.bio || 'No bio available',
              pfp: altData.user.pfp,
              followers: altData.user.followers || 0,
              following: altData.user.following || 0,
              provider: 'hubble',
              stats: altData.user.stats || {
                postCount: 0,
                commentCount: 0,
                receivedUpvotes: 0,
                receivedDownvotes: 0,
                givenUpvotes: 0,
                givenDownvotes: 0
              }
            }
          });
        }
      }
      
      const userData = await response.json();
      
      if (!userData || !userData.data) {
        throw new Error(`User with FID ${fid} not found`);
      }
      
      // Format the user data for our application
      return NextResponse.json({
        success: true,
        user: {
          fid,
          username: userData.data.username || `user_${fid}`,
          displayName: userData.data.displayName,
          bio: userData.data.bio || 'No bio available',
          pfp: userData.data.pfp,
          followers: userData.data.followers || 0,
          following: userData.data.following || 0,
          provider: 'hubble',
          stats: userData.data.stats || {
            postCount: 0,
            commentCount: 0,
            receivedUpvotes: 0,
            receivedDownvotes: 0,
            givenUpvotes: 0,
            givenDownvotes: 0
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user from Hubble:', error);
      
      // Return mock user data if Hubble fetch fails
      return NextResponse.json({
        success: true,
        user: {
          fid,
          username: `user_${fid}`,
          displayName: `User ${fid}`,
          bio: 'This is a mock user profile',
          pfp: null,
          followers: Math.floor(Math.random() * 100),
          following: Math.floor(Math.random() * 50),
          provider: 'mock',
          stats: {
            postCount: Math.floor(Math.random() * 10),
            commentCount: Math.floor(Math.random() * 30),
            receivedUpvotes: Math.floor(Math.random() * 50),
            receivedDownvotes: Math.floor(Math.random() * 5),
            givenUpvotes: Math.floor(Math.random() * 20),
            givenDownvotes: Math.floor(Math.random() * 3)
          }
        }
      });
    }
  } catch (error) {
    console.error('Error in user profile API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = parseInt(params.fid);
    
    if (isNaN(fid)) {
      return NextResponse.json(
        { success: false, error: 'Invalid FID format' },
        { status: 400 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Request body is required' },
        { status: 400 }
      );
    }
    
    // Get all users
    const users = getUsers();
    const userIndex = users.findIndex((u: any) => u.fid === fid);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user fields
    const updatedUser = { ...users[userIndex] };
    
    // Update basic profile fields
    if (body.displayName !== undefined) updatedUser.displayName = body.displayName;
    if (body.username !== undefined) updatedUser.username = body.username;
    if (body.bio !== undefined) {
      updatedUser.bio = body.bio;
      if (updatedUser.profile) {
        updatedUser.profile.bio = body.bio;
      }
    }
    if (body.pfp !== undefined) updatedUser.pfp = body.pfp;
    
    // Save updated users array
    users[userIndex] = updatedUser;
    const saved = saveUsers(users);
    
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Failed to save user data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        fid: updatedUser.fid,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        pfp: updatedUser.pfp
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
} 
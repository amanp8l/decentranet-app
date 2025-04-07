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

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    
    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }
    
    // First check if the user exists in our local database
    const users = getUsers();
    const localUser = users.find((u: any) => u.username === username);
    
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
        provider: localUser.provider
      };
      
      return NextResponse.json({
        success: true,
        user: safeUser
      });
    }
    
    // If not found locally, try to fetch from Hubble node
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    
    try {
      // Hubble doesn't have a direct endpoint for username lookup
      // This is a simplified version - in a real app, you'd need to handle this differently
      const response = await fetch(`${HUBBLE_HTTP_URL}/v1/userNameProof?name=${username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        if (userData && userData.fid) {
          // If we found a FID, fetch the complete user data
          const userResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/userDataByFid?fid=${userData.fid}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (userResponse.ok) {
            const userDetails = await userResponse.json();
            
            if (userDetails && userDetails.data) {
              return NextResponse.json({
                success: true,
                user: {
                  fid: userData.fid,
                  username: username,
                  displayName: userDetails.data.displayName,
                  bio: userDetails.data.bio || 'No bio available',
                  pfp: userDetails.data.pfp,
                  followers: userDetails.data.followers || 0,
                  following: userDetails.data.following || 0,
                  provider: 'hubble'
                }
              });
            }
          }
        }
      }
      
      // Not found in Hubble, check local casts to see if we can find the username
      // This is a fallback for demo purposes
      const castsPath = path.join(process.cwd(), 'data', 'casts.json');
      if (fs.existsSync(castsPath)) {
        try {
          const castsData = fs.readFileSync(castsPath, 'utf8');
          const casts = JSON.parse(castsData || '[]');
          
          // Find a cast with the matching username
          const castWithUsername = casts.find((cast: any) => cast.username === username);
          
          if (castWithUsername) {
            return NextResponse.json({
              success: true,
              user: {
                fid: castWithUsername.fid,
                username: username,
                displayName: castWithUsername.displayName || username,
                bio: 'User found in local casts',
                pfp: null,
                followers: 0,
                following: 0,
                provider: 'local'
              }
            });
          }
        } catch (error) {
          console.error('Error reading casts file:', error);
        }
      }
      
      // If we can't find the user, return a mock response with 404 status
      return NextResponse.json(
        { success: false, error: `User with username ${username} not found` },
        { status: 404 }
      );
    } catch (error) {
      console.error('Error fetching user from Hubble:', error);
      
      // Return 404 if we can't find the user
      return NextResponse.json(
        { success: false, error: `User with username ${username} not found` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in user profile API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
} 
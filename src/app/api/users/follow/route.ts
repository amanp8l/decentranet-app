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
    // Ensure the data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
}

// Follow/unfollow a user
export async function POST(request: NextRequest) {
  try {
    const { userFid, targetFid, action } = await request.json();
    
    if (!userFid || !targetFid || (action !== 'follow' && action !== 'unfollow')) {
      return NextResponse.json(
        { success: false, error: 'Invalid follow data' },
        { status: 400 }
      );
    }
    
    // Convert to numbers if they aren't already
    const userFidNum = typeof userFid === 'string' ? parseInt(userFid) : userFid;
    const targetFidNum = typeof targetFid === 'string' ? parseInt(targetFid) : targetFid;
    
    if (isNaN(userFidNum) || isNaN(targetFidNum)) {
      return NextResponse.json(
        { success: false, error: 'FIDs must be valid numbers' },
        { status: 400 }
      );
    }
    
    if (userFidNum === targetFidNum) {
      return NextResponse.json(
        { success: false, error: 'You cannot follow yourself' },
        { status: 400 }
      );
    }
    
    // Load users from database
    const users = getUsers();
    
    // Find the user and target
    const userIndex = users.findIndex((u: any) => u.fid === userFidNum);
    const targetUserIndex = users.findIndex((u: any) => u.fid === targetFidNum);
    
    // If we can't find the user, return an error
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get user objects
    const user = users[userIndex];
    const targetUser = targetUserIndex !== -1 ? users[targetUserIndex] : null;
    
    // Initialize following array if it doesn't exist
    if (!user.following) {
      user.following = [];
    }
    
    if (targetUser && !targetUser.followers) {
      targetUser.followers = [];
    }
    
    let message = '';
    let farcasterSubmissionSuccess = false;
    
    // Check if Neynar API is enabled
    const isUsingNeynar = process.env.NEXT_PUBLIC_USE_NEYNAR_API === 'true' || !!process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
    
    if (isUsingNeynar) {
      try {
        // Import the neynarApi
        const { neynarApi } = await import('@/lib/neynar');
        
        if (action === 'follow') {
          // Try to follow the user via Neynar
          const result = await neynarApi.follow(userFidNum, targetFidNum);
          console.log('Follow submitted to Farcaster via Neynar:', result);
          farcasterSubmissionSuccess = true;
        } else if (action === 'unfollow') {
          // Try to unfollow the user via Neynar
          const result = await neynarApi.unfollow(userFidNum, targetFidNum);
          console.log('Unfollow submitted to Farcaster via Neynar:', result);
          farcasterSubmissionSuccess = true;
        }
      } catch (error) {
        console.error('Error submitting follow/unfollow to Farcaster via Neynar:', error);
        // Fall back to local storage only
      }
    } else {
      // Try to submit to Farcaster (Hubble) as before
      const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
      
      try {
        // Check if Hubble node is connected
        const infoResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (infoResponse.ok) {
          if (action === 'follow') {
            // Try to submit the follow action to Farcaster
            const response = await fetch(`${HUBBLE_HTTP_URL}/v1/submitLink`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: 'LINK_TYPE_FOLLOW',
                fid: userFidNum,
                targetFid: targetFidNum
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('Follow submitted to Farcaster:', result);
              farcasterSubmissionSuccess = true;
            } else {
              // Try alternative endpoint format
              const altResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/submitMessage`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  type: 'MESSAGE_TYPE_LINK_ADD',
                  fid: userFidNum,
                  linkBody: {
                    type: 'follow',
                    targetFid: targetFidNum
                  }
                })
              });
              
              if (altResponse.ok) {
                const altResult = await altResponse.json();
                console.log('Follow submitted to Farcaster (alt method):', altResult);
                farcasterSubmissionSuccess = true;
              }
            }
          } else if (action === 'unfollow') {
            // Try to remove the follow link on Farcaster
            const response = await fetch(`${HUBBLE_HTTP_URL}/v1/submitMessage`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: 'MESSAGE_TYPE_LINK_REMOVE',
                fid: userFidNum,
                linkBody: {
                  type: 'follow', 
                  targetFid: targetFidNum
                }
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('Unfollow submitted to Farcaster:', result);
              farcasterSubmissionSuccess = true;
            }
          }
        }
      } catch (error) {
        console.error('Error submitting follow/unfollow to Farcaster:', error);
      }
    }
    
    // Always update local storage regardless of Farcaster success
    // This ensures we have local state for users who authenticate with email
    
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
    const saveSuccessful = saveUsers(users);
    
    if (!saveSuccessful) {
      return NextResponse.json(
        { success: false, error: 'Failed to save follow data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message,
      farcasterSynced: farcasterSubmissionSuccess
    });
  } catch (error) {
    console.error('Error processing follow/unfollow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process follow request' },
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
    
    // Convert to numbers
    const userFidNum = parseInt(userFid);
    const targetFidNum = parseInt(targetFid);
    
    if (isNaN(userFidNum) || isNaN(targetFidNum)) {
      return NextResponse.json(
        { success: false, error: 'FIDs must be valid numbers' },
        { status: 400 }
      );
    }
    
    // Check if Neynar API is enabled
    const isUsingNeynar = process.env.NEXT_PUBLIC_USE_NEYNAR_API === 'true' || !!process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
    
    if (isUsingNeynar) {
      try {
        // Import the neynarApi
        const { neynarApi } = await import('@/lib/neynar');
        
        // First get the following list for the user
        const following = await neynarApi.getFollowing(userFidNum);
        
        // Check if the target user is in the following list
        const isFollowing = following && Array.isArray(following) && 
          following.some((followedUser: any) => followedUser && followedUser.fid === targetFidNum);
        
        return NextResponse.json({
          success: true,
          isFollowing: !!isFollowing,
          source: 'neynar'
        });
      } catch (error) {
        console.error('Error checking follow status via Neynar:', error);
        // Fall back to local storage
      }
    }
    
    // Fall back to local check
    const users = getUsers();
    const user = users.find((u: any) => u.fid === userFidNum);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user is following target
    const isFollowing = user.following ? user.following.includes(targetFidNum) : false;
    
    return NextResponse.json({
      success: true,
      isFollowing: !!isFollowing,
      source: 'local'
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
} 
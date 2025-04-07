import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Path to user database file
const USER_DB_PATH = path.join(process.cwd(), 'data', 'email-users.json');

// Helper to get users from JSON file
function getUsers() {
  if (!fs.existsSync(USER_DB_PATH)) {
    return [];
  }
  const data = fs.readFileSync(USER_DB_PATH, 'utf8');
  return JSON.parse(data || '[]');
}

// Save casts to a file for development
const CASTS_DB_PATH = path.join(process.cwd(), 'data', 'casts.json');

function getCasts() {
  if (!fs.existsSync(CASTS_DB_PATH)) {
    return [];
  }
  try {
    const data = fs.readFileSync(CASTS_DB_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading casts:', error);
    return [];
  }
}

function saveCasts(casts: any[]) {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(CASTS_DB_PATH, JSON.stringify(casts, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const { text, fid, mentions = [], mentionsPositions = [], embeds = [] } = await request.json();
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Valid text is required' },
        { status: 400 }
      );
    }

    let userFid = fid;
    let userName = '';
    let userDisplayName = '';
    let userAvatar = '';
    
    // Check if user is authenticated
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract token from the auth header
      const token = authHeader.split(' ')[1];
      
      // Check if the token matches any email-authenticated user
      const users = getUsers();
      const user = users.find((u: any) => u.authToken === token);
      
      if (user) {
        // Use the authenticated user's FID
        userFid = user.fid;
        userName = user.username;
        userDisplayName = user.displayName;
        userAvatar = user.pfp;
      }
    }
    
    // Ensure we have a valid FID at this point, either from the request or from auth
    if (!userFid) {
      return NextResponse.json(
        { success: false, error: 'No valid FID provided' },
        { status: 400 }
      );
    }
    
    // Connect to Hubble node to submit the cast
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    
    // First check if the Hubble node is running
    let isHubbleConnected = false;
    try {
      // For Hubble v1.19.1, check the info endpoint
      const infoResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (infoResponse.ok) {
        isHubbleConnected = true;
        const infoData = await infoResponse.json();
        console.log('Hubble node info for cast submission:', infoData);
        
        // If we're still syncing, let the user know
        if (infoData && infoData.isSyncing) {
          console.log("Hubble node is still syncing, will store cast locally");
        }
      }
    } catch (connectError) {
      console.error('Cannot connect to Hubble node:', connectError);
    }
    
    // Try to submit to Hubble if it's connected
    if (isHubbleConnected) {
      try {
        // For v1.19.1, try the submitMessage endpoint
        const response = await fetch(`${HUBBLE_HTTP_URL}/v1/submitMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'MESSAGE_TYPE_CAST_ADD',
            fid: userFid,
            castAddBody: {
              text,
              embeds,
              mentions,
              mentionsPositions
            }
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          return NextResponse.json({ success: true, data: result });
        }
        
        // Try alternative endpoint
        const altResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/submitCast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fid: userFid,
            text,
            embeds,
            mentions,
            mentionsPositions
          })
        });
        
        if (altResponse.ok) {
          const altResult = await altResponse.json();
          return NextResponse.json({ success: true, data: altResult });
        }
      } catch (submitError) {
        console.error('Error submitting cast to Hubble:', submitError);
      }
    }
    
    // If we reach here, either Hubble isn't connected or submission failed
    // Save the cast locally for development
    const newCast = {
      id: uuidv4(),
      hash: `0x${Math.random().toString(16).substr(2, 40)}`,
      fid: userFid,
      username: userName,
      displayName: userDisplayName,
      avatar: userAvatar,
      data: {
        text,
        timestamp: Date.now(),
        mentions,
        mentionsPositions,
        embeds
      },
      createdAt: new Date().toISOString()
    };
    
    // Store in local JSON file
    const casts = getCasts();
    casts.unshift(newCast); // Add to beginning of array (newest first)
    saveCasts(casts);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        message: "Cast was created successfully",
        cast: newCast
      }
    });
  } catch (error) {
    console.error('Error submitting cast:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit cast' },
      { status: 500 }
    );
  }
} 
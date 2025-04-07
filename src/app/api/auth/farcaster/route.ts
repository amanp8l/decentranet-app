import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Path to auth session storage
const AUTH_SESSIONS_PATH = path.join(process.cwd(), 'data', 'auth-sessions.json');
const USER_DB_PATH = path.join(process.cwd(), 'data', 'email-users.json');

// Get sessions from JSON file
function getSessions() {
  if (!fs.existsSync(AUTH_SESSIONS_PATH)) {
    return {};
  }
  try {
    const data = fs.readFileSync(AUTH_SESSIONS_PATH, 'utf8');
    return JSON.parse(data || '{}');
  } catch (error) {
    console.error('Error reading auth sessions:', error);
    return {};
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

// Create a demo user
function createDemoUser() {
  const users = getUsers();
  
  // Check if demo user already exists
  const existingDemo = users.find((u: any) => u.email === 'demo@example.com');
  if (existingDemo) {
    // Update auth token
    existingDemo.authToken = uuidv4();
    saveUsers(users);
    return existingDemo;
  }
  
  // Create new demo user
  const demoUser = {
    id: uuidv4(),
    email: 'demo@example.com',
    username: 'demo_user',
    displayName: 'Demo User',
    fid: 9000000001,
    provider: 'farcaster',
    pfp: null,
    bio: 'This is a demo Farcaster account',
    followers: [],
    following: [],
    stats: {
      postCount: 0,
      commentCount: 0,
      receivedUpvotes: 0,
      receivedDownvotes: 0,
      givenUpvotes: 0,
      givenDownvotes: 0
    },
    verifications: [],
    authToken: uuidv4(),
    createdAt: new Date().toISOString()
  };
  
  users.push(demoUser);
  saveUsers(users);
  
  return demoUser;
}

export async function POST(request: NextRequest) {
  try {
    const { nonce, useDemoAccount } = await request.json();
    
    // Demo account fallback
    if (useDemoAccount) {
      const demoUser = createDemoUser();
      
      // Remove sensitive information
      const { passwordHash, passwordSalt, ...safeUser } = demoUser;
      
      return NextResponse.json({
        success: true,
        user: safeUser
      });
    }
    
    // Nonce-based authentication (from Warpcast)
    if (nonce) {
      const sessions = getSessions();
      const session = sessions[nonce];
      
      if (!session || !session.status || session.status !== 'completed') {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired authentication session' },
          { status: 400 }
        );
      }
      
      const { fid } = session;
      
      if (!fid) {
        return NextResponse.json(
          { success: false, error: 'No FID found in session' },
          { status: 400 }
        );
      }
      
      // Check if user exists or create a new one
      const users = getUsers();
      let user = users.find((u: any) => u.provider === 'farcaster' && u.fid === fid);
      
      if (!user) {
        // Create a new user from the Farcaster authentication
        user = {
          id: uuidv4(),
          username: `farcaster_${fid}`,
          displayName: `Farcaster ${fid}`,
          fid,
          provider: 'farcaster',
          pfp: session.pfpUrl || null,
          bio: `Farcaster user with FID ${fid}`,
          followers: [],
          following: [],
          stats: {
            postCount: 0,
            commentCount: 0,
            receivedUpvotes: 0,
            receivedDownvotes: 0,
            givenUpvotes: 0,
            givenDownvotes: 0
          },
          verifications: [],
          authToken: uuidv4(),
          createdAt: new Date().toISOString()
        };
        
        users.push(user);
      } else {
        // Update existing user
        user.authToken = uuidv4();
        if (session.pfpUrl) {
          user.pfp = session.pfpUrl;
        }
      }
      
      saveUsers(users);
      
      // Remove sensitive information
      const { passwordHash, passwordSalt, ...safeUser } = user;
      
      return NextResponse.json({
        success: true,
        user: safeUser
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid authentication request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in Farcaster authentication:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Path to users database
const USER_DB_PATH = path.join(process.cwd(), 'data', 'email-users.json');

// Get users from JSON file
function getUsers() {
  if (!fs.existsSync(USER_DB_PATH)) {
    fs.writeFileSync(USER_DB_PATH, JSON.stringify([]), 'utf8');
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

// Generate a random FID (Farcaster ID)
function generateFid() {
  return Math.floor(1000000000 + Math.random() * 9000000000);
}

// Hash a password
function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    const users = getUsers();
    const isRegistration = action === 'register';
    
    // Check if user exists
    const existingUser = users.find((u: any) => u.email === email);
    
    if (isRegistration) {
      // Handle registration
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 400 }
        );
      }
      
      // Create new user
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const userId = uuidv4();
      const fid = generateFid();
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      
      const newUser = {
        id: userId,
        email,
        passwordHash,
        passwordSalt: salt,
        username,
        displayName: username,
        fid,
        provider: 'email',
        pfp: null,
        bio: `I'm ${username}, joined via email registration`,
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
      
      users.push(newUser);
      saveUsers(users);
      
      // Return user data (without sensitive fields)
      const { passwordHash: _, passwordSalt: __, ...safeUser } = newUser;
      
      return NextResponse.json({
        success: true,
        user: safeUser
      });
    } else {
      // Handle login
      if (!existingUser) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 400 }
        );
      }
      
      // Verify password
      const inputHash = hashPassword(password, existingUser.passwordSalt);
      if (inputHash !== existingUser.passwordHash) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 400 }
        );
      }
      
      // Update auth token
      const userIndex = users.findIndex((u: any) => u.email === email);
      users[userIndex].authToken = uuidv4();
      saveUsers(users);
      
      // Return user data (without sensitive fields)
      const { passwordHash: _, passwordSalt: __, ...safeUser } = users[userIndex];
      
      return NextResponse.json({
        success: true,
        user: safeUser
      });
    }
  } catch (error) {
    console.error('Error in email authentication:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 
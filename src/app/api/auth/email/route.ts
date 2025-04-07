import { NextRequest, NextResponse } from 'next/server';
import { generateMockUser } from '@/lib/mock-data';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Simple user storage for development - in production, use a proper database
const USER_DB_PATH = path.join(process.cwd(), 'data', 'email-users.json');

// Ensure the data directory exists
function ensureDataDirExists() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Get users from JSON file
function getUsers() {
  ensureDataDirExists();
  if (!fs.existsSync(USER_DB_PATH)) {
    return [];
  }
  const data = fs.readFileSync(USER_DB_PATH, 'utf8');
  return JSON.parse(data || '[]');
}

// Save users to JSON file
function saveUsers(users: any[]) {
  ensureDataDirExists();
  fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2));
}

// Hash password with salt
function hashPassword(password: string, salt?: string) {
  const newSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, newSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: newSalt };
}

// Login with email and password
export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json();
    
    if (!email || !email.includes('@') || !password) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 400 }
      );
    }
    
    const users = getUsers();
    
    // Register new user
    if (action === 'register') {
      // Check if user already exists
      const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 400 }
        );
      }
      
      // Create a new user with a mock FID
      const mockFid = Math.floor(1000000000 + Math.random() * 9000000000);
      const { hash, salt } = hashPassword(password);
      
      // Generate a user profile with display name from email
      const displayName = email.split('@')[0];
      const username = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const newUser = {
        id: uuidv4(),
        email,
        passwordHash: hash,
        passwordSalt: salt,
        username,
        displayName,
        fid: mockFid,
        provider: 'email',
        pfp: null,
        bio: `I'm ${displayName}, joined via email registration`,
        followers: 0,
        following: 0,
        verifications: [],
        authToken: uuidv4(),
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      saveUsers(users);
      
      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
          fid: newUser.fid,
          provider: newUser.provider,
          pfp: newUser.pfp,
          bio: newUser.bio,
          followers: newUser.followers,
          following: newUser.following,
          verifications: newUser.verifications,
          authToken: newUser.authToken
        }
      });
    }
    
    // Login existing user
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 400 }
      );
    }
    
    // Verify password
    const { hash } = hashPassword(password, user.passwordSalt);
    if (hash !== user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 400 }
      );
    }
    
    // Generate a new auth token
    user.authToken = uuidv4();
    saveUsers(users);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        fid: user.fid,
        provider: 'email',
        pfp: user.pfp,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        verifications: user.verifications,
        authToken: user.authToken
      }
    });
  } catch (error) {
    console.error('Email authentication error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 
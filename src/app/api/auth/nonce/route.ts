import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Path to auth session storage
const AUTH_SESSIONS_PATH = path.join(process.cwd(), 'data', 'auth-sessions.json');

// Get sessions from JSON file
function getSessions() {
  if (!fs.existsSync(AUTH_SESSIONS_PATH)) {
    fs.writeFileSync(AUTH_SESSIONS_PATH, JSON.stringify({}), 'utf8');
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

// Save sessions to JSON file
function saveSessions(sessions: Record<string, any>) {
  try {
    fs.writeFileSync(AUTH_SESSIONS_PATH, JSON.stringify(sessions, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving auth sessions:', error);
    return false;
  }
}

// Create a new nonce for Farcaster authentication
export async function GET(request: NextRequest) {
  try {
    // Generate a new nonce
    const nonce = uuidv4();
    
    // Create message for Warpcast
    const baseUrl = request.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/auth/callback?nonce=${nonce}`;
    
    // Current timestamp
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create SIWE message
    const message = {
      domain: request.headers.get('host') || 'localhost:3000',
      uri: callbackUrl,
      version: '1',
      nonce: nonce,
      issuedAt: new Date(timestamp * 1000).toISOString(),
      expirationTime: new Date((timestamp + 3600) * 1000).toISOString(), // 1 hour
      statement: 'Sign in with Farcaster to authenticate with our app.',
      resources: []
    };
    
    // Save nonce to sessions
    const sessions = getSessions();
    sessions[nonce] = {
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date((timestamp + 3600) * 1000).toISOString()
    };
    saveSessions(sessions);
    
    // Return nonce and message
    return NextResponse.json({
      success: true,
      nonce,
      messageJson: JSON.stringify(message),
      callbackUrl
    });
  } catch (error) {
    console.error('Error creating nonce:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create nonce' },
      { status: 500 }
    );
  }
}

// Endpoint to check status of a nonce
export async function POST(request: NextRequest) {
  try {
    const { nonce } = await request.json();
    
    if (!nonce) {
      return NextResponse.json(
        { success: false, error: 'Nonce is required' },
        { status: 400 }
      );
    }
    
    const sessions = getSessions();
    const session = sessions[nonce];
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid nonce' },
        { status: 400 }
      );
    }
    
    // Check if session has expired
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Nonce has expired' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      status: session.status,
      fid: session.fid
    });
  } catch (error) {
    console.error('Error checking nonce status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check nonce status' },
      { status: 500 }
    );
  }
} 
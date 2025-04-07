import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to auth session storage
const AUTH_SESSIONS_PATH = path.join(process.cwd(), 'data', 'auth-sessions.json');

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

// Handle Warpcast sign callbacks via HTTP GET
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nonce = searchParams.get('nonce');
    
    if (!nonce) {
      return redirectWithError('Missing nonce parameter');
    }
    
    // Check for valid nonce in our sessions
    const sessions = getSessions();
    const session = sessions[nonce];
    
    if (!session) {
      return redirectWithError('Invalid nonce');
    }
    
    // Update session with success status (the Farcaster API will have added data)
    // This will be picked up by the client polling for status
    session.status = 'completed';
    saveSessions(sessions);
    
    // Redirect back to the app with success
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(`${baseUrl}?auth=success&nonce=${nonce}`);
  } catch (error) {
    console.error('Error in auth callback:', error);
    return redirectWithError('Authentication failed');
  }
}

// Handle direct API callbacks (from POST requests or window.postMessage)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nonce, fid, message, signature } = body;
    
    if (!nonce || !fid) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Validate the nonce
    const sessions = getSessions();
    const session = sessions[nonce];
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid nonce' },
        { status: 400 }
      );
    }
    
    // Update session with user data
    sessions[nonce] = {
      ...session,
      status: 'completed',
      fid,
      message,
      signature,
      completedAt: new Date().toISOString()
    };
    
    saveSessions(sessions);
    
    return NextResponse.json({
      success: true,
      message: 'Authentication completed'
    });
  } catch (error) {
    console.error('Error in auth callback POST:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Helper function to redirect with an error
function redirectWithError(errorMessage: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const errorParam = encodeURIComponent(errorMessage);
  return NextResponse.redirect(`${baseUrl}?auth=error&reason=${errorParam}`);
} 
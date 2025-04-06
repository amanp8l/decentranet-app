import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Store nonces in cookies instead of memory for serverless compatibility
export async function GET(request: NextRequest) {
  try {
    // Generate a random nonce
    const nonce = randomBytes(16).toString('hex');
    
    // Get domain and origin information
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const origin = request.headers.get('origin') || `${protocol}://${host}`;
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Social UI';
    
    // Current timestamp
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes in the future
    
    // Create the exact message format Warpcast expects
    // See: https://docs.farcaster.xyz/auth-kit/warpcast-auth#message-format
    const message = {
      domain: host,
      uri: origin,
      version: "1",
      nonce: nonce,
      issuedAt: issuedAt,
      expirationTime: expirationTime,
      statement: `Sign in to ${appName} with your Farcaster account`,
      resources: []
    };
    
    // Create simple nonce data to store in cookie
    const nonceData = {
      nonce,
      status: 'pending',
      createdAt: Date.now()
    };
    
    // Generate response with cookie
    const response = NextResponse.json({
      success: true,
      nonce,
      message,
      messageJson: JSON.stringify(message)
    });
    
    // Set a single cookie for ALL nonces to simplify retrieval
    const allNonces = JSON.parse(request.cookies.get('warpcast_nonces')?.value || '{}');
    allNonces[nonce] = nonceData;
    
    console.log('Current nonces in cookie:', Object.keys(allNonces));
    
    // Set the cookie
    response.cookies.set({
      name: 'warpcast_nonces',
      value: JSON.stringify(allNonces),
      httpOnly: true,
      maxAge: 60 * 60, // 60 minutes instead of 30
      path: '/',
      sameSite: 'lax',
      secure: false // Allow non-secure in development
    });
    
    console.log('Generated nonce:', nonce);
    console.log('Message:', JSON.stringify(message));
    console.log('Storing nonce data:', nonceData);
    
    return response;
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate authentication nonce'
    }, { status: 500 });
  }
}

// Helper functions for nonce status management
export function getNonceStatus(request: NextRequest, nonce: string): any {
  try {
    const allNonces = JSON.parse(request.cookies.get('warpcast_nonces')?.value || '{}');
    return allNonces[nonce] || null;
  } catch (error) {
    console.error('Error getting nonce status:', error);
    return null;
  }
}

export function updateNonceStatus(request: NextRequest, nonce: string, data: any): { cookieName: string, cookieValue: string } {
  try {
    const allNonces = JSON.parse(request.cookies.get('warpcast_nonces')?.value || '{}');
    allNonces[nonce] = {
      ...data,
      updatedAt: Date.now()
    };
    return {
      cookieName: 'warpcast_nonces',
      cookieValue: JSON.stringify(allNonces)
    };
  } catch (error) {
    console.error('Error updating nonce status:', error);
    return {
      cookieName: 'warpcast_nonces',
      cookieValue: '{}'
    };
  }
} 
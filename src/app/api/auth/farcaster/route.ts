import { NextRequest, NextResponse } from 'next/server';
import { getNonceStatus } from '../nonce/route';

// Sample user data for demo purposes
const sampleUsers = [
  {
    id: 'warpcast_3',
    username: 'dwr',
    displayName: 'Dan Romero',
    fid: 3,
    pfp: 'https://i.imgur.com/LfBOvjk.png',
    bio: 'Building Farcaster',
    followers: 83250,
    following: 1256,
    verifications: [
      {
        type: 'ethereum',
        address: '0x7E0b0363404751346930F045827C185C86303C3D'
      }
    ]
  },
  {
    id: 'warpcast_2',
    username: 'v',
    displayName: 'Varun Srinivasan',
    fid: 2,
    pfp: 'https://i.imgur.com/DXpWdD8.jpg',
    bio: 'Building @farcaster',
    followers: 61430,
    following: 1122,
    verifications: [
      {
        type: 'ethereum',
        address: '0x6E0b0363404751346930F045827C185C86303C7A'
      }
    ]
  }
];

// This function handles Warpcast authentication
export async function POST(request: NextRequest) {
  try {
    let body: { 
      useDemoAccount?: boolean; 
      nonce?: string;
      [key: string]: any;
    } = {};
    
    // Safely parse JSON - handle empty bodies
    try {
      const text = await request.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch (e) {
      console.warn('Error parsing JSON request body:', e);
      // Continue with empty body object
    }
    
    console.log('Farcaster auth request:', JSON.stringify(body));
    
    // Case 1: Demo account requested
    if (body.useDemoAccount) {
      console.log('Using demo account for login');
      return returnDemoUser();
    }
    
    // Case 2: Nonce-based authentication
    const nonce = body.nonce;
    
    if (nonce) {
      // Check for cookie presence first
      const allNoncesCookie = request.cookies.get('warpcast_nonces');
      if (!allNoncesCookie) {
        console.log('No warpcast_nonces cookie found in farcaster endpoint');
        return NextResponse.json({ 
          success: false, 
          error: 'No authentication data found' 
        }, { status: 400 });
      }
      
      // Get nonce status from cookie
      const nonceData = getNonceStatus(request, nonce);
      
      if (nonceData && nonceData.status === 'completed' && nonceData.fid) {
        console.log(`Completing authentication for FID ${nonceData.fid}`);
        
        // Find matching user or create generic one
        return getUserByFid(nonceData.fid);
      } else {
        console.log('Invalid nonce or authentication not completed:', nonce);
        if (nonceData) {
          console.log('Nonce data:', nonceData);
        }
        return NextResponse.json({ 
          success: false, 
          error: 'Authentication not completed' 
        }, { status: 400 });
      }
    }
    
    // Fall back to demo user if no valid authentication method
    console.log('No valid authentication method, using demo user');
    return returnDemoUser();
  } catch (error) {
    console.error('Farcaster authentication error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, { status: 500 });
  }
}

// Helper to return a user by FID
function getUserByFid(fid: number) {
  // First try to find in sample users
  const matchedUser = sampleUsers.find(u => u.fid === fid);
  
  if (matchedUser) {
    return NextResponse.json({
      success: true,
      user: {
        ...matchedUser,
        registeredAt: new Date().toISOString(),
        authToken: `fc_auth_${matchedUser.fid}_${Date.now()}`,
        signer: {
          signerPublicKey: '0x04d2c96312e59ba8ff4e32228241dc7a431ec87c2463f8bca78a1d3e3071fc88',
          signerScheme: 'eip712',
          status: 'valid'
        }
      }
    });
  }
  
  // Return generic user with the FID
  return NextResponse.json({
    success: true,
    user: {
      id: `farcaster_${fid}`,
      username: `user${fid}`,
      displayName: `User ${fid}`,
      fid: fid,
      pfp: `https://api.dicebear.com/7.x/identicon/svg?seed=${fid}`,
      bio: 'Farcaster user',
      followers: 100,
      following: 100,
      registeredAt: new Date().toISOString(),
      authToken: `fc_auth_${fid}_${Date.now()}`,
      signer: {
        signerPublicKey: '0x04d2c96312e59ba8ff4e32228241dc7a431ec87c2463f8bca78a1d3e3071fc88',
        signerScheme: 'eip712',
        status: 'valid'
      }
    }
  });
}

// Helper to return a random demo user
function returnDemoUser() {
  const selectedUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
  
  return NextResponse.json({
    success: true,
    user: {
      ...selectedUser,
      registeredAt: new Date().toISOString(),
      authToken: `fc_auth_${selectedUser.fid}_${Date.now()}`,
      signer: {
        signerPublicKey: '0x04d2c96312e59ba8ff4e32228241dc7a431ec87c2463f8bca78a1d3e3071fc88',
        signerScheme: 'eip712',
        status: 'valid'
      }
    }
  });
} 
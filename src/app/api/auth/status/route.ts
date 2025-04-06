import { NextRequest, NextResponse } from 'next/server';
import { getNonceStatus } from '../nonce/route';

export async function GET(request: NextRequest) {
  try {
    // Get the nonce from the query string
    const searchParams = request.nextUrl.searchParams;
    const nonce = searchParams.get('nonce');
    
    if (!nonce) {
      return NextResponse.json({
        success: false,
        error: 'Missing nonce parameter'
      }, { status: 400 });
    }
    
    // Log all cookies to help debug
    console.log('All cookies in status endpoint:');
    request.cookies.getAll().forEach(cookie => {
      console.log(`- ${cookie.name}: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`);
    });
    
    // Check for cookie presence first
    const allNoncesCookie = request.cookies.get('warpcast_nonces');
    if (!allNoncesCookie) {
      console.log('No warpcast_nonces cookie found');
      return NextResponse.json({
        success: false,
        error: 'No authentication data found'
      }, { status: 404 });
    }
    
    // Get nonce status from cookie
    const nonceData = getNonceStatus(request, nonce);
    
    if (!nonceData) {
      console.log(`Nonce ${nonce} not found in cookie store`);
      console.log('Cookie value:', allNoncesCookie.value);
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired nonce'
      }, { status: 404 });
    }
    
    console.log(`Nonce ${nonce} status:`, nonceData.status);
    
    // Return the current status of the authentication request
    const status = nonceData.status;
    
    // If completed, return the FID as well
    if (status === 'completed') {
      return NextResponse.json({
        success: true,
        status,
        fid: nonceData.fid
      });
    }
    
    // For pending or other statuses
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check authentication status'
    }, { status: 500 });
  }
} 
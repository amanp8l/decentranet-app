import { NextRequest, NextResponse } from 'next/server';
import { nonceStore } from '../nonce/route';

// This handles the redirect from Warpcast web auth, which uses frames
export async function GET(request: NextRequest) {
  try {
    // Get the message, signature, and fid from the URL parameters
    const searchParams = request.nextUrl.searchParams;
    const message = searchParams.get('message');
    const signature = searchParams.get('signature');
    const fidParam = searchParams.get('fid');
    
    if (!message || !signature || !fidParam) {
      return NextResponse.redirect(`${request.nextUrl.origin}/?auth=error&reason=missing_params`);
    }
    
    // Parse the FID as a number
    const fid = parseInt(fidParam, 10);
    if (isNaN(fid)) {
      return NextResponse.redirect(`${request.nextUrl.origin}/?auth=error&reason=invalid_fid`);
    }
    
    // Extract the nonce from the message
    let nonce = '';
    try {
      const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/i);
      if (nonceMatch && nonceMatch[1]) {
        nonce = nonceMatch[1];
      }
    } catch (error) {
      console.error('Error extracting nonce from message:', error);
    }
    
    if (!nonce || !nonceStore[nonce]) {
      return NextResponse.redirect(`${request.nextUrl.origin}/?auth=error&reason=invalid_nonce`);
    }
    
    // In a production implementation, you would verify the signature here
    // For this demo, we'll accept it as valid
    
    // Mark this authentication as completed
    nonceStore[nonce] = {
      ...nonceStore[nonce],
      status: 'completed',
      fid,
      signature
    };
    
    // Redirect back to the application
    return NextResponse.redirect(`${request.nextUrl.origin}/?auth=success&nonce=${nonce}`);
  } catch (error) {
    console.error('Error processing frame callback:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/?auth=error&reason=server_error`);
  }
} 
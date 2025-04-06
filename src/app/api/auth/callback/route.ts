import { NextRequest, NextResponse } from 'next/server';
import { verifyFarcasterSignature } from '@/utils/farcasterSignatureVerifier';
import { getNonceStatus, updateNonceStatus } from '../nonce/route';

// Handle Warpcast sign callbacks via HTTP GET
export async function GET(request: NextRequest) {
  try {
    // Get the URL parameters
    const url = new URL(request.url);
    const { searchParams } = url;
    
    // Log the callback URL for debugging
    console.log('Warpcast callback received:', request.url);
    
    // Extract parameters (Warpcast returns different formats depending on device)
    const nonce = searchParams.get('nonce');
    
    if (!nonce) {
      console.error('Missing nonce in callback');
      return NextResponse.redirect(`${url.origin}/?auth=error&reason=missing_nonce`);
    }
    
    // Get nonce status from cookie
    const storedNonceData = getNonceStatus(request, nonce);
    if (!storedNonceData) {
      console.error('Invalid or expired nonce:', nonce);
      return NextResponse.redirect(`${url.origin}/?auth=error&reason=invalid_nonce`);
    }
    
    // Get the message and signature data
    const messageParam = searchParams.get('message');
    const signatureParam = searchParams.get('signature');
    const fidParam = searchParams.get('fid');
    
    // Log what we received
    console.log('Callback parameters:', { 
      nonce, 
      hasFid: !!fidParam,
      hasSignature: !!signatureParam,
      hasMessage: !!messageParam 
    });
    
    // Extract FID either directly or from signature/message
    let fid = null;
    
    // If we have a direct FID parameter
    if (fidParam) {
      fid = Number(fidParam);
    } 
    // Try to extract from signature/message
    else if (signatureParam || messageParam) {
      try {
        const verification = await verifyFarcasterSignature({
          signature: signatureParam,
          message: messageParam
        }, messageParam);
        
        if (verification.valid && verification.fid) {
          fid = verification.fid;
        }
      } catch (error) {
        console.error('Error verifying signature:', error);
      }
    }
    
    // If we found a valid FID, mark the authentication as complete
    if (fid) {
      // Update the nonce data in the cookie
      const updatedNonceData = {
        ...storedNonceData,
        status: 'completed',
        fid,
        signature: signatureParam || messageParam || 'direct_fid'
      };
      
      // Update the nonce in the cookie store
      const { cookieName, cookieValue } = updateNonceStatus(request, nonce, updatedNonceData);
      
      // Create response with redirect
      const response = NextResponse.redirect(`${url.origin}/?auth=success&nonce=${nonce}`);
      
      // Update the cookie
      response.cookies.set({
        name: cookieName,
        value: cookieValue,
        httpOnly: true,
        maxAge: 60 * 30, // 30 minutes
        path: '/',
        sameSite: 'lax'
      });
      
      return response;
    }
    
    // If we got here, we couldn't extract a valid FID
    console.error('Could not extract valid FID from callback');
    return NextResponse.redirect(`${url.origin}/?auth=error&reason=missing_fid`);
  } catch (error) {
    console.error('Error handling Warpcast callback:', error);
    return NextResponse.redirect(`${new URL(request.url).origin}/?auth=error&reason=server_error`);
  }
}

// Handle direct API callbacks (from POST requests or window.postMessage)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Callback POST received:', JSON.stringify(body).substring(0, 200) + '...');
    
    // Extract the nonce from the request
    let nonce = null;
    let fid = null;
    
    // Try to extract nonce from various locations
    if (body.message) {
      try {
        const messageObj = typeof body.message === 'string' 
          ? JSON.parse(body.message) 
          : body.message;
        nonce = messageObj.nonce;
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    }
    
    // Try signature.message
    if (!nonce && body.signature && body.signature.message) {
      try {
        const messageObj = typeof body.signature.message === 'string' 
          ? JSON.parse(body.signature.message) 
          : body.signature.message;
        nonce = messageObj.nonce;
      } catch (e) {
        console.error('Error parsing signature.message:', e);
      }
    }
    
    // Direct nonce field
    if (!nonce && body.nonce) {
      nonce = body.nonce;
    }
    
    // If no valid nonce, return error
    if (!nonce) {
      return NextResponse.json({
        success: false,
        error: 'Missing nonce in request'
      }, { status: 400 });
    }
    
    // Get nonce status from cookie
    const storedNonceData = getNonceStatus(request, nonce);
    if (!storedNonceData) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired nonce'
      }, { status: 400 });
    }
    
    // Try to extract FID
    if (body.fid) {
      fid = Number(body.fid);
    } else if (body.signature && body.signature.fid) {
      fid = Number(body.signature.fid);
    } else {
      // Try to verify signature to extract FID
      const verification = await verifyFarcasterSignature(body, body.message || null);
      if (verification.valid && verification.fid) {
        fid = verification.fid;
      }
    }
    
    // If we have a valid FID, mark authentication as complete
    if (fid) {
      // Create updated data
      const updatedNonceData = {
        ...storedNonceData,
        status: 'completed',
        fid,
        signature: JSON.stringify(body)
      };
      
      // Update the nonce in the cookie store
      const { cookieName, cookieValue } = updateNonceStatus(request, nonce, updatedNonceData);
      
      // Create response
      const response = NextResponse.json({
        success: true,
        message: 'Authentication successful'
      });
      
      // Update the cookie
      response.cookies.set({
        name: cookieName,
        value: cookieValue,
        httpOnly: true,
        maxAge: 60 * 30, // 30 minutes
        path: '/',
        sameSite: 'lax'
      });
      
      return response;
    }
    
    // If we couldn't extract a FID, return error
    return NextResponse.json({
      success: false,
      error: 'Could not extract valid FID from request'
    }, { status: 400 });
  } catch (error) {
    console.error('Error in POST callback:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
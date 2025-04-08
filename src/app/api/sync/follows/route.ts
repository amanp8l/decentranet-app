import { NextRequest, NextResponse } from 'next/server';
import { syncFollowsToFarcaster } from '@/utils/farcasterSync';

export async function POST(request: NextRequest) {
  try {
    const { hubbleUrl } = await request.json();
    
    // Use provided Hubble URL or default
    const syncResult = await syncFollowsToFarcaster(hubbleUrl);
    
    return NextResponse.json(syncResult);
  } catch (error) {
    console.error('Error syncing follows:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to sync follows',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// GET endpoint to check sync status and report configuration
export async function GET() {
  try {
    const config = {
      hubbleHttpUrl: process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281',
      hubbleGrpcUrl: process.env.NEXT_PUBLIC_HUBBLE_GRPC_URL || 'http://localhost:2283'
    };
    
    // Check if Hubble is available
    let hubbleStatus = 'unknown';
    let hubbleInfo = null;
    
    try {
      const response = await fetch(`${config.hubbleHttpUrl}/v1/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        hubbleStatus = 'connected';
        hubbleInfo = await response.json();
      } else {
        hubbleStatus = 'error';
      }
    } catch (error) {
      hubbleStatus = 'unavailable';
    }
    
    return NextResponse.json({
      success: true,
      config,
      hubbleStatus,
      hubbleInfo,
      usage: {
        POST: "Submit a POST request to this endpoint to trigger follow syncing",
        body: {
          hubbleUrl: "(optional) Override the Hubble HTTP URL"
        }
      }
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check sync status' 
    }, { status: 500 });
  }
} 
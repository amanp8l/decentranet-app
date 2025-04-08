import { NextRequest, NextResponse } from 'next/server';
import { syncAllToFarcaster } from '@/utils/farcasterSync';

export async function POST(request: NextRequest) {
  try {
    const { hubbleUrl } = await request.json();
    
    // Use provided Hubble URL or default
    const syncResult = await syncAllToFarcaster(hubbleUrl);
    
    return NextResponse.json(syncResult);
  } catch (error) {
    console.error('Error syncing all content:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to sync content to Farcaster',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { syncResearchToFarcaster } from '@/utils/farcasterSync';

export async function POST(request: NextRequest) {
  try {
    const { hubbleUrl } = await request.json();
    
    // Use provided Hubble URL or default
    const syncResult = await syncResearchToFarcaster(hubbleUrl);
    
    return NextResponse.json({
      success: syncResult.success,
      stats: {
        research: {
          total: syncResult.totalContributions,
          synced: syncResult.synced,
          failed: syncResult.failed
        },
        casts: { total: 0, synced: 0, failed: 0 },
        votes: { total: 0, synced: 0, failed: 0 },
        follows: { total: 0, synced: 0, failed: 0 },
        topics: { total: 0, synced: 0, failed: 0 }
      },
      errors: syncResult.errors
    });
  } catch (error) {
    console.error('Error syncing research:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to sync research',
      details: error instanceof Error ? error.message : 'Unknown error',
      stats: {
        research: { total: 0, synced: 0, failed: 0 },
        casts: { total: 0, synced: 0, failed: 0 },
        votes: { total: 0, synced: 0, failed: 0 },
        follows: { total: 0, synced: 0, failed: 0 },
        topics: { total: 0, synced: 0, failed: 0 }
      },
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }, { status: 500 });
  }
} 
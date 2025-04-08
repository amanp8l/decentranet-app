import { NextRequest, NextResponse } from 'next/server';
import { syncForumTopicsToFarcaster } from '@/utils/farcasterSync';

export async function POST(request: NextRequest) {
  try {
    const { hubbleUrl } = await request.json();
    
    // Use provided Hubble URL or default
    const syncResult = await syncForumTopicsToFarcaster(hubbleUrl);
    
    return NextResponse.json({
      success: syncResult.success,
      stats: {
        topics: {
          total: syncResult.totalTopics,
          synced: syncResult.synced,
          failed: syncResult.failed
        },
        casts: { total: 0, synced: 0, failed: 0 },
        votes: { total: 0, synced: 0, failed: 0 },
        follows: { total: 0, synced: 0, failed: 0 },
        research: { total: 0, synced: 0, failed: 0 }
      },
      errors: syncResult.errors
    });
  } catch (error) {
    console.error('Error syncing topics:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to sync topics',
      details: error instanceof Error ? error.message : 'Unknown error',
      stats: {
        topics: { total: 0, synced: 0, failed: 0 },
        casts: { total: 0, synced: 0, failed: 0 },
        votes: { total: 0, synced: 0, failed: 0 },
        follows: { total: 0, synced: 0, failed: 0 },
        research: { total: 0, synced: 0, failed: 0 }
      },
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }, { status: 500 });
  }
} 
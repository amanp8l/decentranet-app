import { NextRequest, NextResponse } from 'next/server';
import { getTokenTransactions } from '@/lib/blockchain';

// GET /api/tokens/history/[fid] - Get token transaction history for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const { fid } = params;
    
    if (!fid) {
      return NextResponse.json(
        { success: false, error: 'User FID is required' },
        { status: 400 }
      );
    }
    
    const fidNumber = parseInt(fid, 10);
    if (isNaN(fidNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid FID format' },
        { status: 400 }
      );
    }
    
    const transactions = await getTokenTransactions(fidNumber);
    
    return NextResponse.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching token history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token history' },
      { status: 500 }
    );
  }
} 
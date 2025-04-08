import { NextRequest, NextResponse } from 'next/server';
import { getTokenBalance } from '@/lib/blockchain';

// GET /api/tokens/balance/[fid] - Get token balance for a specific user
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
    
    const balance = await getTokenBalance(fidNumber);
    
    return NextResponse.json({
      success: true,
      balance
    });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token balance' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { transferTokens, getTokenBalance } from '@/lib/blockchain';
import { getAuthenticatedUser } from '@/lib/auth';

// POST /api/tokens/transfer - Transfer tokens to another user
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authenticatedUser = await getAuthenticatedUser(request);
    if (!authenticatedUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { toFid, amount, reason, contributionId } = body;
    
    // Validate required fields
    if (!toFid) {
      return NextResponse.json(
        { success: false, error: 'Recipient FID is required' },
        { status: 400 }
      );
    }
    
    const toFidNumber = Number(toFid);
    if (isNaN(toFidNumber)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recipient FID format' },
        { status: 400 }
      );
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid positive amount is required' },
        { status: 400 }
      );
    }
    
    if (!reason || !['contribution', 'review', 'upvote', 'nomination', 'grant', 'other'].includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Valid reason is required' },
        { status: 400 }
      );
    }
    
    // Perform the transfer
    try {
      const transaction = await transferTokens(
        authenticatedUser.fid,
        toFidNumber,
        Number(amount),
        reason,
        contributionId
      );
      
      // Get updated balance
      const newBalance = await getTokenBalance(authenticatedUser.fid);
      
      return NextResponse.json({
        success: true,
        transaction,
        newBalance
      });
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to transfer tokens'
        },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Error processing token transfer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process token transfer' },
      { status: 500 }
    );
  }
} 
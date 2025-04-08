import { NextRequest, NextResponse } from 'next/server';
import { getUserReputation, verifyCredentials } from '@/lib/blockchain';

// GET /api/reputation/[fid] - Get reputation for a specific user
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
    
    const reputation = await getUserReputation(fidNumber);
    
    return NextResponse.json({
      success: true,
      reputation
    });
  } catch (error) {
    console.error('Error fetching reputation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reputation' },
      { status: 500 }
    );
  }
}

// POST /api/reputation/[fid] - Verify credentials for a user
export async function POST(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const { fid } = params;
    const body = await request.json();
    
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
    
    // Validate required fields
    const { 
      verificationType,
      institution 
    } = body;
    
    if (!verificationType) {
      return NextResponse.json(
        { success: false, error: 'Verification type is required' },
        { status: 400 }
      );
    }
    
    if (!['academic', 'clinical', 'industry', 'research'].includes(verificationType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification type' },
        { status: 400 }
      );
    }
    
    // Verify credentials
    const reputation = await verifyCredentials(
      fidNumber,
      verificationType,
      institution
    );
    
    return NextResponse.json({
      success: true,
      reputation
    });
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify credentials' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getContribution, nominateContribution } from '@/lib/contribution';

// POST /api/research/contributions/[id]/nominate - Nominate a research contribution
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contribution ID is required' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    const { 
      nominatorFid,
      category
    } = body;
    
    if (!nominatorFid) {
      return NextResponse.json(
        { success: false, error: 'Nominator FID is required' },
        { status: 400 }
      );
    }
    
    // Check if contribution exists
    const contribution = await getContribution(id);
    if (!contribution) {
      return NextResponse.json(
        { success: false, error: 'Contribution not found' },
        { status: 404 }
      );
    }
    
    // Prevent self-nomination
    if (contribution.authorFid === nominatorFid) {
      return NextResponse.json(
        { success: false, error: 'You cannot nominate your own contribution' },
        { status: 400 }
      );
    }
    
    // Nominate the contribution
    const updatedContribution = await nominateContribution(
      id,
      nominatorFid,
      category || contribution.tags[0] || 'research'
    );
    
    return NextResponse.json({
      success: true,
      contribution: updatedContribution
    });
  } catch (error) {
    console.error('Error nominating contribution:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to nominate contribution' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getContribution } from '@/lib/contribution';

// GET /api/research/contributions/[id] - Get a specific research contribution
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Contribution ID is required' },
        { status: 400 }
      );
    }
    
    const contribution = await getContribution(id);
    
    if (!contribution) {
      return NextResponse.json(
        { success: false, error: 'Contribution not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      contribution
    });
  } catch (error) {
    console.error('Error fetching contribution:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contribution' },
      { status: 500 }
    );
  }
} 
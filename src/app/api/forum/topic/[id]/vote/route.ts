import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const topicId = params.id;
    const body = await request.json();
    const { value, userId } = body;
    
    if (!topicId) {
      return NextResponse.json(
        { success: false, error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    if (typeof value !== 'number' || ![1, -1].includes(value)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote value' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // In a real application, this would:
    // 1. Verify the user is authenticated
    // 2. Update the topic vote in the database
    // 
    // For this demo, we'll just return success since we're handling the UI optimistically

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record vote' },
      { status: 500 }
    );
  }
} 
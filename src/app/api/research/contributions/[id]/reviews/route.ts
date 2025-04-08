import { NextRequest, NextResponse } from 'next/server';
import { getContribution, getReviews, submitReview, voteOnReview } from '@/lib/contribution';

// GET /api/research/contributions/[id]/reviews - Get all reviews for a contribution
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
    
    // Check if contribution exists
    const contribution = await getContribution(id);
    if (!contribution) {
      return NextResponse.json(
        { success: false, error: 'Contribution not found' },
        { status: 404 }
      );
    }
    
    const reviews = await getReviews(id);
    
    return NextResponse.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/research/contributions/[id]/reviews - Submit a new review
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
      reviewerFid, 
      reviewerName, 
      content,
      rating
    } = body;
    
    if (!reviewerFid || !content || !rating) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    // Submit the review
    const review = await submitReview(
      id,
      reviewerFid,
      reviewerName || `User ${reviewerFid}`,
      content,
      rating
    );
    
    return NextResponse.json({
      success: true,
      review
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit review';
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH /api/research/contributions/[id]/reviews - Vote on a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { 
      reviewId,
      voterFid,
      value
    } = body;
    
    if (!reviewId || !voterFid || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate vote value
    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { success: false, error: 'Vote value must be 1 or -1' },
        { status: 400 }
      );
    }
    
    // Submit the vote
    const updatedReview = await voteOnReview(
      reviewId,
      voterFid,
      value
    );
    
    return NextResponse.json({
      success: true,
      review: updatedReview
    });
  } catch (error) {
    console.error('Error voting on review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to vote on review' },
      { status: 500 }
    );
  }
} 
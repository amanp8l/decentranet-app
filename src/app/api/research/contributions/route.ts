import { NextRequest, NextResponse } from 'next/server';
import { createContribution, getContributions } from '@/lib/contribution';
import { v4 as uuidv4 } from 'uuid';

// GET /api/research/contributions - Get all research contributions with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const authorFid = searchParams.get('authorFid');
    const tagsParam = searchParams.get('tags');
    const status = searchParams.get('status') as 'draft' | 'published' | 'peer_reviewed' | 'verified' | undefined;
    
    // Convert parameters to appropriate types
    const authorFidNum = authorFid ? parseInt(authorFid, 10) : undefined;
    const tags = tagsParam ? tagsParam.split(',') : undefined;
    
    const contributions = await getContributions(authorFidNum, tags, status);
    
    return NextResponse.json({
      success: true,
      contributions
    });
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contributions' },
      { status: 500 }
    );
  }
}

// POST /api/research/contributions - Create a new research contribution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { 
      title, 
      abstract, 
      content, 
      authorFid, 
      authorName, 
      tags,
      links,
      collaborators
    } = body;
    
    if (!title || !abstract || !content || !authorFid || !tags || !links) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create the contribution
    const contribution = await createContribution(
      title,
      abstract,
      content,
      authorFid,
      authorName,
      tags,
      links,
      collaborators
    );
    
    return NextResponse.json({
      success: true,
      contribution
    });
  } catch (error) {
    console.error('Error creating contribution:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create contribution' },
      { status: 500 }
    );
  }
} 
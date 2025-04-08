import { NextRequest, NextResponse } from 'next/server';
import { createContribution, getContributions } from '@/lib/contribution';
import { v4 as uuidv4 } from 'uuid';

// Hubble node URL
const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';

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
    
    // Try to submit to Farcaster directly
    let farcasterSubmissionSuccess = false;
    let farcasterHash = null;
    
    try {
      // Check if Hubble node is connected
      const infoResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (infoResponse.ok) {
        // Try to submit the contribution to Farcaster
        const response = await fetch(`${HUBBLE_HTTP_URL}/v1/submitMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'MESSAGE_TYPE_CAST_ADD',
            fid: authorFid,
            castAddBody: {
              text: `Research: ${title}\n\n${abstract.substring(0, 240)}${abstract.length > 240 ? '...' : ''}\n\nTags: ${tags.join(', ')}`,
              mentions: [],
              mentionsPositions: [],
              embeds: []
            }
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Contribution submitted to Farcaster:', result);
          farcasterSubmissionSuccess = true;
          
          if (result.hash) {
            farcasterHash = result.hash;
            // Update the contribution with the hash
            contribution.farcasterHash = farcasterHash;
          }
        }
      }
    } catch (error) {
      console.error('Error submitting to Farcaster:', error);
      // Don't fail if Farcaster submission fails
    }
    
    return NextResponse.json({
      success: true,
      contribution,
      farcasterSubmissionSuccess,
      farcasterHash
    });
  } catch (error) {
    console.error('Error creating contribution:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create contribution' },
      { status: 500 }
    );
  }
} 
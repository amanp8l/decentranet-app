import { NextRequest, NextResponse } from 'next/server';
import { getContribution } from '@/lib/contribution';
import fs from 'fs';
import path from 'path';

// POST /api/research/contributions/[id]/farcaster - Update Farcaster hash for a contribution
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
    const { farcasterHash } = body;
    
    if (!farcasterHash) {
      return NextResponse.json(
        { success: false, error: 'Farcaster hash is required' },
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
    
    // In a real application, this would update the database
    // For demo purposes, we'll use in-memory update
    contribution.farcasterHash = farcasterHash;
    
    // Create a success response
    return NextResponse.json({
      success: true,
      contribution
    });
  } catch (error) {
    console.error('Error updating contribution Farcaster hash:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contribution Farcaster hash' },
      { status: 500 }
    );
  }
} 
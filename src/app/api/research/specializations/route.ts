import { NextRequest, NextResponse } from 'next/server';
import { getSpecializationFields } from '@/lib/contribution';

// GET /api/research/specializations - Get all specialization fields
export async function GET(request: NextRequest) {
  try {
    const specializations = await getSpecializationFields();
    
    return NextResponse.json({
      success: true,
      specializations
    });
  } catch (error) {
    console.error('Error fetching specializations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch specializations' },
      { status: 500 }
    );
  }
} 
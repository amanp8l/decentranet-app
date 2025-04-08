import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ForumCategory } from '@/types/forum';

export async function GET() {
  try {
    // Read categories from the JSON file
    const filePath = path.join(process.cwd(), 'data', 'forum-categories.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const categories: ForumCategory[] = JSON.parse(fileData);
    
    // Sort by order field
    categories.sort((a, b) => a.order - b.order);
    
    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Error fetching forum categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 
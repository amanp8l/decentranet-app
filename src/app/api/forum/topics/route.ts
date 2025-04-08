import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ForumTopic } from '@/types/forum';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    
    // Read topics from the JSON file
    const filePath = path.join(process.cwd(), 'data', 'forum-topics.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    let topics: ForumTopic[] = JSON.parse(fileData);
    
    // Filter by category if specified
    if (categoryId) {
      topics = topics.filter(topic => topic.categoryId === categoryId);
    }
    
    // Sort by pinned first, then by timestamp (newest first)
    topics.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (b.lastReplyTimestamp || b.timestamp) - (a.lastReplyTimestamp || a.timestamp);
    });
    
    return NextResponse.json({
      success: true,
      topics,
    });
  } catch (error) {
    console.error('Error fetching forum topics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
} 
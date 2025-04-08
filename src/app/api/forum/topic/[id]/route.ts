import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ForumTopic, ForumReply } from '@/types/forum';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const topicId = params.id;
    
    // Read topics from the JSON file
    const topicsFilePath = path.join(process.cwd(), 'data', 'forum-topics.json');
    const topicsFileData = fs.readFileSync(topicsFilePath, 'utf8');
    const topics: ForumTopic[] = JSON.parse(topicsFileData);
    
    // Find the requested topic
    const topic = topics.find(t => t.id === topicId);
    
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }
    
    // Read replies from the JSON file
    const repliesFilePath = path.join(process.cwd(), 'data', 'forum-replies.json');
    const repliesFileData = fs.readFileSync(repliesFilePath, 'utf8');
    const allReplies: ForumReply[] = JSON.parse(repliesFileData);
    
    // Filter replies for this topic
    const replies = allReplies.filter(reply => reply.topicId === topicId);
    
    // Sort replies by timestamp (oldest first), then by nested structure
    const sortedReplies = sortReplies(replies);
    
    // Increment view count (in a real app, this would be done more carefully)
    topic.viewCount += 1;
    fs.writeFileSync(topicsFilePath, JSON.stringify(topics, null, 2));
    
    return NextResponse.json({
      success: true,
      topic,
      replies: sortedReplies,
    });
  } catch (error) {
    console.error('Error fetching forum topic:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch topic' },
      { status: 500 }
    );
  }
}

// Helper function to sort replies in a threaded/nested structure
function sortReplies(replies: ForumReply[]): ForumReply[] {
  // First, separate top-level replies and nested replies
  const topLevelReplies = replies.filter(reply => !reply.parentId);
  const nestedReplies = replies.filter(reply => !!reply.parentId);
  
  // Sort top-level replies by timestamp (oldest first)
  topLevelReplies.sort((a, b) => a.timestamp - b.timestamp);
  
  // Process each top-level reply to include its nested replies
  const processedReplies: ForumReply[] = [];
  
  for (const reply of topLevelReplies) {
    processedReplies.push(reply);
    
    // Find and sort direct children of this reply
    const children = nestedReplies.filter(r => r.parentId === reply.id);
    children.sort((a, b) => a.timestamp - b.timestamp);
    
    processedReplies.push(...children);
  }
  
  return processedReplies;
} 
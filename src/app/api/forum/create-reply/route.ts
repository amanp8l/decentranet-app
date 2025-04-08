import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ForumReply, ForumTopic } from '@/types/forum';

// Helper function to save to comments format
async function saveToCommentsFormat(reply: ForumReply, topic: ForumTopic) {
  try {
    // Save the comment to the comment structure
    const commentsFilePath = path.join(process.cwd(), 'data', 'comments.json');
    let comments: Record<string, any[]> = {};
    
    if (fs.existsSync(commentsFilePath)) {
      const commentsData = fs.readFileSync(commentsFilePath, 'utf8');
      comments = JSON.parse(commentsData);
    }
    
    // Create comment object
    const commentData = {
      id: reply.id,
      text: reply.content,
      authorFid: reply.authorFid,
      timestamp: reply.timestamp,
      parentId: reply.parentId,
      votes: reply.votes || [],
      replies: []
    };
    
    // Add to comments
    if (!comments[topic.id]) {
      comments[topic.id] = [];
    }
    
    // If this is a reply to another comment, add it to the parent's replies array
    if (reply.parentId) {
      const parentComment = comments[topic.id].find((c) => c.id === reply.parentId);
      if (parentComment) {
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(reply.id);
      }
    }
    
    comments[topic.id].push(commentData);
    fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error saving to comments format:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.content || !body.topicId || !body.authorFid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate reply ID and timestamp
    const replyId = `reply-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const timestamp = Date.now();
    
    // Create new reply object
    const newReply: ForumReply = {
      id: replyId,
      topicId: body.topicId,
      content: body.content,
      authorFid: body.authorFid,
      authorName: body.authorName,
      timestamp,
      parentId: body.parentId, // Optional - for nested replies
      isAnswer: body.isAnswer || false, // Optional - mark as accepted answer
      votes: []
    };
    
    // Read existing replies
    const repliesFilePath = path.join(process.cwd(), 'data', 'forum-replies.json');
    let replies: ForumReply[] = [];
    
    if (fs.existsSync(repliesFilePath)) {
      const fileData = fs.readFileSync(repliesFilePath, 'utf8');
      replies = JSON.parse(fileData);
    }
    
    // Add the new reply
    replies.push(newReply);
    
    // Write back to the file
    fs.writeFileSync(repliesFilePath, JSON.stringify(replies, null, 2));
    
    // Update topic reply count and last reply info
    const topicsFilePath = path.join(process.cwd(), 'data', 'forum-topics.json');
    if (fs.existsSync(topicsFilePath)) {
      const topicsData = fs.readFileSync(topicsFilePath, 'utf8');
      const topics: ForumTopic[] = JSON.parse(topicsData);
      
      const topicIndex = topics.findIndex((t) => t.id === body.topicId);
      if (topicIndex !== -1) {
        const topic = topics[topicIndex];
        topic.replyCount = (topic.replyCount || 0) + 1;
        topic.lastReplyTimestamp = timestamp;
        topic.lastReplyAuthorFid = body.authorFid;
        topic.lastReplyAuthorName = body.authorName;
        
        // Save in comments format
        await saveToCommentsFormat(newReply, topic);
        
        fs.writeFileSync(topicsFilePath, JSON.stringify(topics, null, 2));
      }
    }
    
    return NextResponse.json({
      success: true,
      reply: newReply
    });
  } catch (error) {
    console.error('Error creating forum reply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create reply' },
      { status: 500 }
    );
  }
} 
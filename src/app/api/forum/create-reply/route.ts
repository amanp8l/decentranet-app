import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ForumReply, ForumTopic } from '@/types/forum';

// Hubble node URL
const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';

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
    if (!body.content || !body.authorFid || !body.topicId) {
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
      content: body.content,
      authorFid: body.authorFid,
      authorName: body.authorName,
      topicId: body.topicId,
      timestamp,
      isAnswer: body.isAnswer || false,
      parentId: body.parentId || null,
      votes: []
    };
    
    // Read comments from the JSON file
    const filePath = path.join(process.cwd(), 'data', 'comments.json');
    let comments: Record<string, any[]> = {};
    
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      comments = JSON.parse(fileData);
    }
    
    // Add the new reply to the topic's comments
    if (!comments[body.topicId]) {
      comments[body.topicId] = [];
    }
    
    comments[body.topicId].push(newReply);
    
    // Write back to the file
    fs.writeFileSync(filePath, JSON.stringify(comments, null, 2));
    
    // Update topic reply count and last reply info
    const topicsFilePath = path.join(process.cwd(), 'data', 'forum-topics.json');
    let topicData = null;
    
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
        topicData = topic;
        
        // Save in comments format
        await saveToCommentsFormat(newReply, topic);
        
        fs.writeFileSync(topicsFilePath, JSON.stringify(topics, null, 2));
      }
    }
    
    // Try to submit to Farcaster directly
    let farcasterSubmissionSuccess = false;
    let farcasterHash = null;
    
    try {
      if (topicData) {
        // Check if Hubble node is connected
        const infoResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (infoResponse.ok) {
          // If topic has a Farcaster hash, submit as a reply to that cast
          // Otherwise submit as a new cast mentioning the topic
          let requestBody;
          
          if (topicData.farcasterHash) {
            // Submit as a reply to the original topic cast
            requestBody = {
              type: 'MESSAGE_TYPE_CAST_ADD',
              fid: body.authorFid,
              castAddBody: {
                text: body.content.substring(0, 280) + (body.content.length > 280 ? '...' : ''),
                mentions: [],
                mentionsPositions: [],
                embeds: [],
                parentCastId: {
                  fid: topicData.authorFid,
                  hash: topicData.farcasterHash
                }
              }
            };
          } else {
            // Submit as a new cast mentioning the topic
            requestBody = {
              type: 'MESSAGE_TYPE_CAST_ADD',
              fid: body.authorFid,
              castAddBody: {
                text: `Re: ${topicData.title}\n\n${body.content.substring(0, 240)}${body.content.length > 240 ? '...' : ''}`,
                mentions: [],
                mentionsPositions: [],
                embeds: []
              }
            };
          }
          
          // Submit the reply to Farcaster
          const response = await fetch(`${HUBBLE_HTTP_URL}/v1/submitMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Reply submitted to Farcaster:', result);
            farcasterSubmissionSuccess = true;
            
            if (result.hash) {
              farcasterHash = result.hash;
              
              // Update the reply with the hash in the comments file
              const replyIndex = comments[body.topicId].findIndex(r => r.id === replyId);
              if (replyIndex !== -1) {
                comments[body.topicId][replyIndex].farcasterHash = farcasterHash;
                fs.writeFileSync(filePath, JSON.stringify(comments, null, 2));
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error submitting to Farcaster:', error);
      // Don't fail if Farcaster submission fails
    }
    
    return NextResponse.json({
      success: true,
      reply: newReply,
      farcasterSubmissionSuccess,
      farcasterHash
    });
  } catch (error) {
    console.error('Error creating forum reply:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create reply' },
      { status: 500 }
    );
  }
} 
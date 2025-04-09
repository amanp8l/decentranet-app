import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ForumReply, ForumTopic } from '@/types/forum';
import { v4 as uuidv4 } from 'uuid';

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
    if (!body.topicId || !body.content || !body.authorFid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Find topic
    const topicsFilePath = path.join(process.cwd(), 'data', 'forum', 'topics', 'topics.json');
    let topicData = null;
    
    if (fs.existsSync(topicsFilePath)) {
      const data = fs.readFileSync(topicsFilePath, 'utf8');
      const topics = JSON.parse(data || '[]');
      topicData = topics.find((t: any) => t.id === body.topicId);
      
      if (!topicData) {
        return NextResponse.json(
          { success: false, error: 'Topic not found' },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Topics database not found' },
        { status: 500 }
      );
    }
    
    // Find author info
    const usersFilePath = path.join(process.cwd(), 'data', 'email-users.json');
    let authorName = `User ${body.authorFid}`;
    let authorPfp = null;
    let authorUsername = `user_${body.authorFid}`;
    
    if (fs.existsSync(usersFilePath)) {
      const userData = fs.readFileSync(usersFilePath, 'utf8');
      const users = JSON.parse(userData || '[]');
      const author = users.find((user: any) => user.fid === body.authorFid);
      
      if (author) {
        authorName = author.displayName || author.name || authorName;
        authorPfp = author.pfp || null;
        authorUsername = author.username || authorUsername;
      }
    }
    
    // Generate reply ID and timestamp
    const replyId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Create new reply object
    const newReply = {
      id: replyId,
      topicId: body.topicId,
      content: body.content,
      authorFid: body.authorFid,
      authorName,
      authorUsername,
      authorPfp,
      createdAt: timestamp,
      updatedAt: timestamp,
      parentId: body.parentId || null,
      isAccepted: false,
      votes: [],
      farcasterHash: null
    };
    
    // Save to replies database
    const repliesDir = path.join(process.cwd(), 'data', 'forum', 'replies');
    if (!fs.existsSync(repliesDir)) {
      fs.mkdirSync(repliesDir, { recursive: true });
    }
    
    const repliesFilePath = path.join(repliesDir, `${body.topicId}.json`);
    let replies = [];
    
    if (fs.existsSync(repliesFilePath)) {
      const data = fs.readFileSync(repliesFilePath, 'utf8');
      replies = JSON.parse(data || '[]');
    }
    
    replies.push(newReply);
    fs.writeFileSync(repliesFilePath, JSON.stringify(replies, null, 2));
    
    // Update topic with latest reply info
    const topics = JSON.parse(fs.readFileSync(topicsFilePath, 'utf8'));
    const topicIndex = topics.findIndex((t: any) => t.id === body.topicId);
    
    if (topicIndex !== -1) {
      topics[topicIndex].replyCount = (topics[topicIndex].replyCount || 0) + 1;
      topics[topicIndex].lastReplyAt = timestamp;
      topics[topicIndex].lastReplyAuthor = authorName;
      fs.writeFileSync(topicsFilePath, JSON.stringify(topics, null, 2));
    }
    
    // Try to submit to Farcaster directly
    let farcasterSubmissionSuccess = false;
    let farcasterHash = null;
    
    // Check if Neynar API is enabled
    const isUsingNeynar = process.env.NEXT_PUBLIC_USE_NEYNAR_API === 'true' || !!process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
    
    if (isUsingNeynar && topicData) {
      try {
        // Import the neynarApi
        const { neynarApi } = await import('@/lib/neynar');
        
        // If topic has a Farcaster hash, submit as a reply to that cast
        // Otherwise submit as a new cast mentioning the topic
        if (topicData.farcasterHash) {
          // Submit as a reply to the topic
          const parent = { 
            fid: topicData.authorFid, 
            hash: topicData.farcasterHash 
          };
          
          const result = await neynarApi.postCast(
            body.authorFid, 
            body.content.substring(0, 280) + (body.content.length > 280 ? '...' : ''),
            [],
            parent
          );
          
          console.log('Reply submitted to Farcaster via Neynar:', result);
          farcasterSubmissionSuccess = true;
          
          // If successful, save the Farcaster hash
          if (result && result.cast && result.cast.hash) {
            farcasterHash = result.cast.hash;
            
            // Update the reply with the hash
            newReply.farcasterHash = farcasterHash;
            
            // Update in file
            const replyIndex = replies.findIndex((r: any) => r.id === replyId);
            if (replyIndex !== -1) {
              replies[replyIndex].farcasterHash = farcasterHash;
              fs.writeFileSync(repliesFilePath, JSON.stringify(replies, null, 2));
            }
          }
        } else {
          // Submit as a new cast mentioning the topic
          const text = `Re: ${topicData.title}\n\n${body.content.substring(0, 240)}${body.content.length > 240 ? '...' : ''}`;
          
          const result = await neynarApi.postCast(body.authorFid, text);
          console.log('Reply submitted to Farcaster via Neynar (as new cast):', result);
          farcasterSubmissionSuccess = true;
          
          // If successful, save the Farcaster hash
          if (result && result.cast && result.cast.hash) {
            farcasterHash = result.cast.hash;
            
            // Update the reply with the hash
            newReply.farcasterHash = farcasterHash;
            
            // Update in file
            const replyIndex = replies.findIndex((r: any) => r.id === replyId);
            if (replyIndex !== -1) {
              replies[replyIndex].farcasterHash = farcasterHash;
              fs.writeFileSync(repliesFilePath, JSON.stringify(replies, null, 2));
            }
          }
        }
      } catch (error) {
        console.error('Error submitting reply to Farcaster via Neynar:', error);
        // Don't fail if Farcaster submission fails
      }
    } else if (topicData) {
      // Use original Hubble implementation
      try {
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
              const replyIndex = replies.findIndex((r: any) => r.id === replyId);
              if (replyIndex !== -1) {
                replies[replyIndex].farcasterHash = farcasterHash;
                fs.writeFileSync(repliesFilePath, JSON.stringify(replies, null, 2));
              }
            }
          }
        }
      } catch (error) {
        console.error('Error submitting to Farcaster:', error);
        // Don't fail if Farcaster submission fails
      }
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
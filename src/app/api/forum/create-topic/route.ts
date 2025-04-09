import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ForumTopic } from '@/types/forum';
import { v4 as uuidv4 } from 'uuid';

// Hubble node URL
const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.content || !body.authorFid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Ensure content directory exists
    const topicsDir = path.join(process.cwd(), 'data', 'forum', 'topics');
    if (!fs.existsSync(topicsDir)) {
      fs.mkdirSync(topicsDir, { recursive: true });
    }
    
    // Load existing topics from file
    const topicsFilePath = path.join(topicsDir, 'topics.json');
    let topics = [];
    if (fs.existsSync(topicsFilePath)) {
      const data = fs.readFileSync(topicsFilePath, 'utf8');
      topics = JSON.parse(data || '[]');
    }
    
    // Generate unique ID and create topic object
    const topicId = uuidv4();
    const createdAt = new Date().toISOString();
    
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
    
    // Create new topic
    const newTopic = {
      id: topicId,
      title: body.title,
      content: body.content,
      authorFid: body.authorFid,
      authorName,
      authorUsername,
      authorPfp,
      createdAt,
      updatedAt: createdAt,
      tags: body.tags || [],
      status: "active",
      viewCount: 0,
      replyCount: 0,
      lastReplyAt: null,
      lastReplyAuthor: null,
      farcasterHash: null
    };
    
    // Add topic to array
    topics.push(newTopic);
    
    // Save to file
    fs.writeFileSync(topicsFilePath, JSON.stringify(topics, null, 2));
    
    // Try to submit to Farcaster as well
    let farcasterSubmissionSuccess = false;
    let farcasterHash = null;
    
    // Check if Neynar API is enabled
    const isUsingNeynar = process.env.NEXT_PUBLIC_USE_NEYNAR_API === 'true' || !!process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
    
    if (isUsingNeynar) {
      try {
        // Import the neynarApi
        const { neynarApi } = await import('@/lib/neynar');
        
        // Format the topic text
        const text = `${body.title}\n\n${body.content.substring(0, 280)}${body.content.length > 280 ? '...' : ''}`;
        
        // Submit as a cast
        const result = await neynarApi.postCast(body.authorFid, text);
        console.log('Topic submitted to Farcaster via Neynar:', result);
        farcasterSubmissionSuccess = true;
        
        // If successful, save the Farcaster hash
        if (result && result.cast && result.cast.hash) {
          farcasterHash = result.cast.hash;
          
          // Update the topic with the hash
          newTopic.farcasterHash = farcasterHash;
          
          // Update the topic in the file
          const topicIndex = topics.findIndex(t => t.id === topicId);
          if (topicIndex !== -1) {
            topics[topicIndex].farcasterHash = farcasterHash;
            fs.writeFileSync(topicsFilePath, JSON.stringify(topics, null, 2));
          }
        }
      } catch (error) {
        console.error('Error submitting to Farcaster via Neynar:', error);
        // Don't fail if Farcaster submission fails
      }
    } else {
      // Try using Hubble node (original implementation)
      try {
        // Check if Hubble node is connected
        const infoResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (infoResponse.ok) {
          // Try to submit the topic to Farcaster
          const response = await fetch(`${HUBBLE_HTTP_URL}/v1/submitMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'MESSAGE_TYPE_CAST_ADD',
              fid: body.authorFid,
              castAddBody: {
                text: `${body.title}\n\n${body.content.substring(0, 280)}${body.content.length > 280 ? '...' : ''}`,
                mentions: [],
                mentionsPositions: [],
                embeds: []
              }
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Topic submitted to Farcaster:', result);
            farcasterSubmissionSuccess = true;
            
            if (result.hash) {
              farcasterHash = result.hash;
              // Update the topic with the hash
              newTopic.farcasterHash = farcasterHash;
              
              // Update the topic in the file
              const topicIndex = topics.findIndex(t => t.id === topicId);
              if (topicIndex !== -1) {
                topics[topicIndex].farcasterHash = farcasterHash;
                fs.writeFileSync(topicsFilePath, JSON.stringify(topics, null, 2));
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
      topic: newTopic,
      farcasterSubmissionSuccess,
      farcasterHash
    });
  } catch (error) {
    console.error('Error creating forum topic:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create topic' },
      { status: 500 }
    );
  }
} 
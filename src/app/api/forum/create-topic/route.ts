import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ForumTopic } from '@/types/forum';

// Hubble node URL
const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.content || !body.categoryId || !body.authorFid) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate topic ID and timestamp
    const topicId = `topic-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const timestamp = Date.now();
    
    // Create new topic object
    const newTopic: ForumTopic = {
      id: topicId,
      title: body.title,
      content: body.content,
      authorFid: body.authorFid,
      authorName: body.authorName,
      categoryId: body.categoryId,
      timestamp,
      replyCount: 0,
      viewCount: 0,
      isPinned: body.isPinned || false,
      isLocked: body.isLocked || false,
      tags: body.tags || []
    };
    
    // Read existing topics
    const topicsFilePath = path.join(process.cwd(), 'data', 'forum-topics.json');
    let topics: ForumTopic[] = [];
    
    if (fs.existsSync(topicsFilePath)) {
      const fileData = fs.readFileSync(topicsFilePath, 'utf8');
      topics = JSON.parse(fileData);
    }
    
    // Add the new topic
    topics.unshift(newTopic);
    
    // Write back to the file
    fs.writeFileSync(topicsFilePath, JSON.stringify(topics, null, 2));
    
    // Update category topic count
    const categoriesFilePath = path.join(process.cwd(), 'data', 'forum-categories.json');
    if (fs.existsSync(categoriesFilePath)) {
      const categoriesData = fs.readFileSync(categoriesFilePath, 'utf8');
      const categories = JSON.parse(categoriesData);
      
      const categoryIndex = categories.findIndex((c: any) => c.id === body.categoryId);
      if (categoryIndex !== -1) {
        categories[categoryIndex].topicCount += 1;
        fs.writeFileSync(categoriesFilePath, JSON.stringify(categories, null, 2));
      }
    }
    
    // Initialize empty comments array for this topic
    const commentsFilePath = path.join(process.cwd(), 'data', 'comments.json');
    let comments: Record<string, any[]> = {};
    
    if (fs.existsSync(commentsFilePath)) {
      const commentsData = fs.readFileSync(commentsFilePath, 'utf8');
      comments = JSON.parse(commentsData);
    }
    
    // Initialize empty comments array for this topic
    comments[topicId] = [];
    fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));
    
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
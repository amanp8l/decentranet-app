import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CommentData } from '@/types/social';

// Path to comments database
const COMMENTS_DB_PATH = path.join(process.cwd(), 'data', 'comments.json');
const USER_DB_PATH = path.join(process.cwd(), 'data', 'email-users.json');

// Get comments from JSON file
function getComments() {
  if (!fs.existsSync(COMMENTS_DB_PATH)) {
    fs.writeFileSync(COMMENTS_DB_PATH, JSON.stringify({}), 'utf8');
    return {};
  }
  try {
    const data = fs.readFileSync(COMMENTS_DB_PATH, 'utf8');
    return JSON.parse(data || '{}');
  } catch (error) {
    console.error('Error reading comments:', error);
    return {};
  }
}

// Save comments to JSON file
function saveComments(comments: Record<string, CommentData[]>) {
  try {
    fs.writeFileSync(COMMENTS_DB_PATH, JSON.stringify(comments, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving comments:', error);
    return false;
  }
}

// Get users from JSON file
function getUsers() {
  if (!fs.existsSync(USER_DB_PATH)) {
    return [];
  }
  try {
    const data = fs.readFileSync(USER_DB_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
}

// Save users to JSON file
function saveUsers(users: any[]) {
  try {
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
}

// Update user stats for commenting
function updateUserCommentStats(userId: number) {
  const users = getUsers();
  const userIndex = users.findIndex((u: any) => u.fid === userId);
  
  if (userIndex === -1) return;
  
  // Initialize stats object if it doesn't exist
  if (!users[userIndex].stats) {
    users[userIndex].stats = {
      postCount: 0,
      commentCount: 0,
      receivedUpvotes: 0,
      receivedDownvotes: 0,
      givenUpvotes: 0,
      givenDownvotes: 0
    };
  }
  
  // Increment comment count
  users[userIndex].stats.commentCount = (users[userIndex].stats.commentCount || 0) + 1;
  
  saveUsers(users);
}

// Get comment by ID from all comments
function findCommentById(commentId: string) {
  const allComments = getComments();
  
  for (const castId in allComments) {
    const castComments = allComments[castId];
    const comment = castComments.find((c: CommentData) => c.id === commentId);
    if (comment) {
      return { comment, castId };
    }
  }
  
  return { comment: null, castId: null };
}

// Add a vote to a comment
function addVoteToComment(castId: string, commentId: string, userId: number, value: 1 | -1) {
  const comments = getComments();
  const castComments = comments[castId] || [];
  
  const commentIndex = castComments.findIndex((c: CommentData) => c.id === commentId);
  
  if (commentIndex === -1) {
    return { success: false, error: 'Comment not found' };
  }
  
  const comment = castComments[commentIndex];
  
  // Initialize votes array if it doesn't exist
  if (!comment.votes) {
    comment.votes = [];
  }
  
  // Check if user already voted on this comment
  const existingVoteIndex = comment.votes.findIndex((v: any) => v.userId === userId);
  
  if (existingVoteIndex !== -1) {
    const existingVote = comment.votes[existingVoteIndex];
    
    // If the vote is the same, remove it (toggle off)
    if (existingVote.value === value) {
      comment.votes.splice(existingVoteIndex, 1);
    } else {
      // If the vote is different, update it
      comment.votes[existingVoteIndex] = {
        userId,
        value,
        timestamp: Date.now()
      };
    }
  } else {
    // Add new vote
    comment.votes.push({
      userId,
      value,
      timestamp: Date.now()
    });
  }
  
  // Update the comment in the array
  castComments[commentIndex] = comment;
  comments[castId] = castComments;
  
  // Save updated comments
  saveComments(comments);
  
  return { success: true, comment };
}

// GET endpoint to retrieve comments for a cast
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const castId = searchParams.get('castId');
    
    if (!castId) {
      return NextResponse.json(
        { success: false, error: 'Cast ID is required' },
        { status: 400 }
      );
    }
    
    // Try to get comments from Farcaster first
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    let farcasterComments = null;
    
    try {
      // Check if the Hubble node is connected
      const infoResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (infoResponse.ok) {
        // Extract FID and hash from the castId if it has the format fid-hash
        const castFid = parseInt(castId.split('-')[0]) || 0;
        const castHash = castId.includes('-') ? castId.split('-')[1] : castId;
        
        // Try to get reactions (replies) for this cast
        if (castFid > 0 || castHash) {
          const endpoint = castFid > 0 
            ? `${HUBBLE_HTTP_URL}/v1/castReactions?fid=${castFid}&hash=${castHash}&reactionType=1` 
            : `${HUBBLE_HTTP_URL}/v1/castReactions?hash=${castHash}&reactionType=1`;
          
          const reactionsResponse = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (reactionsResponse.ok) {
            const reactionsData = await reactionsResponse.json();
            
            if (reactionsData && reactionsData.reactions && Array.isArray(reactionsData.reactions)) {
              // Map reactions to our comment format
              farcasterComments = reactionsData.reactions.map((reaction: any) => ({
                id: reaction.hash || uuidv4(),
                text: reaction.text || '',
                authorFid: reaction.fid || 0,
                timestamp: reaction.timestamp || Date.now(),
                votes: [],
                replies: []
              }));
              
              console.log(`Found ${farcasterComments.length} comments for cast ${castId} from Farcaster`);
            }
          }
        }
      }
    } catch (farcasterError) {
      console.error('Error fetching comments from Farcaster:', farcasterError);
    }
    
    // If we got comments from Farcaster, use those
    if (farcasterComments && farcasterComments.length > 0) {
      // Fetch user info for each comment author
      const users = getUsers();
      const commentData = farcasterComments.map((comment: CommentData) => {
        const user = users.find((u: any) => u.fid === comment.authorFid);
        return {
          ...comment,
          author: user ? {
            username: user.username,
            displayName: user.displayName,
            pfp: user.pfp
          } : {
            username: `user_${comment.authorFid}`,
            displayName: `User ${comment.authorFid}`,
            pfp: null
          }
        };
      });
      
      return NextResponse.json({
        success: true,
        comments: commentData,
        source: 'farcaster'
      });
    }
    
    // Fallback to local storage if Farcaster fetch failed or returned empty
    const comments = getComments();
    const castComments = comments[castId] || [];
    
    // For each comment, fetch the author information
    const users = getUsers();
    const commentData = castComments.map((comment: CommentData) => {
      const user = users.find((u: any) => u.fid === comment.authorFid);
      return {
        ...comment,
        author: user ? {
          username: user.username,
          displayName: user.displayName,
          pfp: user.pfp
        } : {
          username: `user_${comment.authorFid}`,
          displayName: `User ${comment.authorFid}`,
          pfp: null
        }
      };
    });
    
    return NextResponse.json({
      success: true,
      comments: commentData,
      source: 'local'
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST endpoint to add a new comment
export async function POST(request: NextRequest) {
  try {
    const { castId, text, authorFid, parentId } = await request.json();
    
    if (!castId || !text || !authorFid) {
      return NextResponse.json(
        { success: false, error: 'Invalid comment data' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID for the comment
    const commentId = uuidv4();
    
    // Create a new comment object
    const newComment: CommentData = {
      id: commentId,
      text,
      authorFid,
      timestamp: Date.now(),
      parentId,
      votes: []
    };
    
    // Try to submit to Hubble/Farcaster first
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    let farcasterSubmissionSuccess = false;
    
    try {
      // Check if Hubble node is connected
      const infoResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (infoResponse.ok) {
        // Try to submit the comment as a reaction to the cast
        // For Farcaster, we'll submit this as a "reply" reaction type
        const submitResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/submitReaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'REACTION_TYPE_REPLY',
            fid: authorFid,
            targetCastId: {
              fid: parseInt(castId.split('-')[0]) || 0,
              hash: castId.includes('-') ? castId.split('-')[1] : castId
            },
            replyBody: {
              text,
              parentCastId: parentId ? {
                fid: parseInt(parentId.split('-')[0]) || 0,
                hash: parentId.includes('-') ? parentId.split('-')[1] : parentId
              } : undefined
            }
          })
        });
        
        if (submitResponse.ok) {
          const result = await submitResponse.json();
          console.log('Comment submitted to Farcaster:', result);
          farcasterSubmissionSuccess = true;
          
          // If successful, we can use the Farcaster reaction hash as our ID
          if (result && result.hash) {
            newComment.id = result.hash;
          }
        } else {
          // Alternative method for v1.19.1 - try as a cast with reference
          const altResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/submitMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'MESSAGE_TYPE_CAST_ADD',
              fid: authorFid,
              castAddBody: {
                text: text,
                mentions: [],
                mentionsPositions: [],
                parentCastId: {
                  fid: parseInt(castId.split('-')[0]) || 0,
                  hash: castId.includes('-') ? castId.split('-')[1] : castId
                }
              }
            })
          });
          
          if (altResponse.ok) {
            const altResult = await altResponse.json();
            console.log('Comment submitted to Farcaster as cast:', altResult);
            farcasterSubmissionSuccess = true;
            
            // If successful, we can use the Farcaster cast hash as our ID
            if (altResult && altResult.hash) {
              newComment.id = altResult.hash;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error submitting comment to Farcaster:', error);
    }
    
    // If Farcaster submission failed or we're in development mode, save locally
    if (!farcasterSubmissionSuccess) {
      console.log('Saving comment locally as fallback');
      const comments = getComments();
      const castComments = comments[castId] || [];
      
      // Check if this is a reply to a comment
      if (parentId) {
        const parentIndex = castComments.findIndex((c: CommentData) => c.id === parentId);
        
        if (parentIndex === -1) {
          return NextResponse.json(
            { success: false, error: 'Parent comment not found' },
            { status: 400 }
          );
        }
        
        // Initialize replies array if it doesn't exist
        if (!castComments[parentIndex].replies) {
          castComments[parentIndex].replies = [];
        }
      }
      
      // Add the comment to the array
      castComments.push(newComment);
      
      // If this is a reply, add the comment ID to the parent's replies
      if (parentId) {
        const parentIndex = castComments.findIndex((c: CommentData) => c.id === parentId);
        if (parentIndex !== -1 && castComments[parentIndex].replies) {
          (castComments[parentIndex].replies as string[]).push(newComment.id);
        }
      }
      
      // Save the updated comments
      comments[castId] = castComments;
      saveComments(comments);
    }
    
    // Update user stats - count both regular comments and replies for points
    updateUserCommentStats(authorFid);
    
    // Get author information
    const users = getUsers();
    const user = users.find((u: any) => u.fid === authorFid);
    
    return NextResponse.json({
      success: true,
      comment: {
        ...newComment,
        author: user ? {
          username: user.username,
          displayName: user.displayName,
          pfp: user.pfp
        } : {
          username: `user_${authorFid}`,
          displayName: `User ${authorFid}`,
          pfp: null
        }
      },
      farcasterSynced: farcasterSubmissionSuccess
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// PATCH endpoint to vote on a comment
export async function PATCH(request: NextRequest) {
  try {
    const { castId, commentId, userId, value } = await request.json();
    
    if (!castId || !commentId || !userId || (value !== 1 && value !== -1)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote data' },
        { status: 400 }
      );
    }
    
    const result = addVoteToComment(castId, commentId, userId, value);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      comment: result.comment
    });
  } catch (error) {
    console.error('Error voting on comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to vote on comment' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Vote } from '@/types/social';
import { v4 as uuidv4 } from 'uuid';

// Path to votes database
const VOTES_DB_PATH = path.join(process.cwd(), 'data', 'votes.json');
const USER_DB_PATH = path.join(process.cwd(), 'data', 'email-users.json');

// Get votes from JSON file
function getVotes() {
  if (!fs.existsSync(VOTES_DB_PATH)) {
    fs.writeFileSync(VOTES_DB_PATH, JSON.stringify({}), 'utf8');
    return {};
  }
  try {
    const data = fs.readFileSync(VOTES_DB_PATH, 'utf8');
    return JSON.parse(data || '{}');
  } catch (error) {
    console.error('Error reading votes:', error);
    return {};
  }
}

// Save votes to JSON file
function saveVotes(votes: Record<string, Vote[]>) {
  try {
    fs.writeFileSync(VOTES_DB_PATH, JSON.stringify(votes, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving votes:', error);
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

// Update user stats for voting
function updateUserVoteStats(userId: number, targetUserId: number, voteValue: 1 | -1, isRemovingVote: boolean = false) {
  const users = getUsers();
  const userIndex = users.findIndex((u: any) => u.fid === userId);
  const targetUserIndex = users.findIndex((u: any) => u.fid === targetUserId);
  
  if (userIndex === -1 || targetUserIndex === -1) return;
  
  // Initialize stats objects if they don't exist
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
  
  if (!users[targetUserIndex].stats) {
    users[targetUserIndex].stats = {
      postCount: 0,
      commentCount: 0,
      receivedUpvotes: 0,
      receivedDownvotes: 0,
      givenUpvotes: 0,
      givenDownvotes: 0
    };
  }
  
  // Update stats based on vote action
  if (isRemovingVote) {
    // Removing a vote
    if (voteValue === 1) {
      users[userIndex].stats.givenUpvotes = Math.max(0, (users[userIndex].stats.givenUpvotes || 0) - 1);
      users[targetUserIndex].stats.receivedUpvotes = Math.max(0, (users[targetUserIndex].stats.receivedUpvotes || 0) - 1);
    } else {
      users[userIndex].stats.givenDownvotes = Math.max(0, (users[userIndex].stats.givenDownvotes || 0) - 1);
      users[targetUserIndex].stats.receivedDownvotes = Math.max(0, (users[targetUserIndex].stats.receivedDownvotes || 0) - 1);
    }
  } else {
    // Adding a vote
    if (voteValue === 1) {
      users[userIndex].stats.givenUpvotes = (users[userIndex].stats.givenUpvotes || 0) + 1;
      users[targetUserIndex].stats.receivedUpvotes = (users[targetUserIndex].stats.receivedUpvotes || 0) + 1;
    } else {
      users[userIndex].stats.givenDownvotes = (users[userIndex].stats.givenDownvotes || 0) + 1;
      users[targetUserIndex].stats.receivedDownvotes = (users[targetUserIndex].stats.receivedDownvotes || 0) + 1;
    }
  }
  
  saveUsers(users);
}

export async function POST(request: NextRequest) {
  try {
    const { castId, userId, targetUserId, value } = await request.json();
    
    if (!castId || !userId || !value || (value !== 1 && value !== -1)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote data' },
        { status: 400 }
      );
    }
    
    let farcasterSubmissionSuccess = false;
    
    // Check if Neynar API is enabled
    const isUsingNeynar = process.env.NEXT_PUBLIC_USE_NEYNAR_API === 'true' || !!process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
    
    // Extract hash from the castId if possible
    const castHash = castId.includes('-') ? castId.split('-')[1] : castId;
    
    if (isUsingNeynar && castHash) {
      try {
        // Import the neynarApi
        const { neynarApi } = await import('@/lib/neynar');
        
        // If upvote (1), like the cast, otherwise ignore (Neynar doesn't support downvotes)
        if (value === 1) {
          const result = await neynarApi.reactToCast(userId, castHash, 'like');
          console.log('Vote submitted to Farcaster via Neynar:', result);
          farcasterSubmissionSuccess = true;
        } else if (value === -1) {
          // For downvotes, just update local stats as Neynar doesn't support this
          console.log('Downvote saved locally only - Neynar does not support downvotes');
        }
      } catch (error) {
        console.error('Error submitting vote to Farcaster via Neynar:', error);
        // Fall back to local storage
      }
    } else {
      // Try to submit to Farcaster (Hubble) as before
      const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
      
      try {
        // Check if Hubble node is available
        const infoResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (infoResponse.ok) {
          // Extract FID and hash from the castId if possible
          const castFid = parseInt(castId.split('-')[0]) || 0;
          const castHash = castId.includes('-') ? castId.split('-')[1] : castId;
          
          // Map vote value to Farcaster reaction type
          // 1 (upvote) = REACTION_TYPE_LIKE (1)
          // -1 (downvote) = REACTION_TYPE_DISLIKE (4)
          const reactionType = value === 1 ? 'REACTION_TYPE_LIKE' : 'REACTION_TYPE_DISLIKE';
          const reactionValue = value === 1 ? 1 : 4;
          
          if (castFid > 0 || castHash) {
            // Submit as a reaction
            const response = await fetch(`${HUBBLE_HTTP_URL}/v1/submitReaction`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: reactionType,
                fid: userId,
                targetCastId: {
                  fid: castFid,
                  hash: castHash
                }
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('Vote submitted to Farcaster:', result);
              farcasterSubmissionSuccess = true;
            } else {
              // Try alternative endpoint for different reaction values
              const altResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/submitReaction`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  reactionType: reactionValue,
                  fid: userId,
                  targetCastId: {
                    fid: castFid,
                    hash: castHash
                  }
                })
              });
              
              if (altResponse.ok) {
                const altResult = await altResponse.json();
                console.log('Vote submitted to Farcaster (alt method):', altResult);
                farcasterSubmissionSuccess = true;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error submitting vote to Farcaster:', error);
      }
    }
    
    // Fall back to local storage if Farcaster submission failed
    if (!farcasterSubmissionSuccess) {
      console.log('Saving vote to local storage as fallback');
      const votes = getVotes();
      
      // Initialize votes array for this cast if it doesn't exist
      if (!votes[castId]) {
        votes[castId] = [];
      }
      
      // Check if user already voted on this cast
      const existingVoteIndex = votes[castId].findIndex((v: Vote) => v.userId === userId);
      
      if (existingVoteIndex !== -1) {
        const existingVote = votes[castId][existingVoteIndex];
        
        // If the vote is the same, remove it (toggle off)
        if (existingVote.value === value) {
          votes[castId].splice(existingVoteIndex, 1);
          updateUserVoteStats(userId, targetUserId, value, true);
        } else {
          // If the vote is different, update it
          votes[castId][existingVoteIndex] = {
            userId,
            value,
            timestamp: Date.now()
          };
          
          // Update user stats (remove old vote, add new vote)
          updateUserVoteStats(userId, targetUserId, existingVote.value, true);
          updateUserVoteStats(userId, targetUserId, value);
        }
      } else {
        // Add new vote
        votes[castId].push({
          userId,
          value,
          timestamp: Date.now()
        });
        
        // Update user stats
        updateUserVoteStats(userId, targetUserId, value);
      }
      
      // Save updated votes
      votes[castId] = votes[castId];
      saveVotes(votes);
    }
    
    // Update user stats for voting
    updateUserVoteStats(userId, targetUserId, value);
    
    return NextResponse.json({
      success: true,
      farcasterSynced: farcasterSubmissionSuccess
    });
  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process vote' },
      { status: 500 }
    );
  }
}

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
    
    // Extract hash from the castId
    const castHash = castId.includes('-') ? castId.split('-')[1] : castId;
    
    // Check if Neynar API is enabled
    const isUsingNeynar = process.env.NEXT_PUBLIC_USE_NEYNAR_API === 'true' || !!process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
    
    if (isUsingNeynar && castHash) {
      try {
        // Import the neynarApi
        const { neynarApi } = await import('@/lib/neynar');
        
        // Get reactions (likes) for this cast
        const likes = await neynarApi.getReactions(castHash, 'like');
        
        // Transform to our expected format
        const transformedVotes = likes.map((like: any) => ({
          userId: like.fid,
          value: 1,  // 'like' reaction
          timestamp: new Date(like.timestamp).getTime()
        }));
        
        return NextResponse.json({
          success: true,
          votes: transformedVotes,
          source: 'neynar'
        });
      } catch (error) {
        console.error('Error fetching votes from Neynar:', error);
        // Fall back to local votes
      }
    }
    
    // Try to get votes from Farcaster via Hubble as before
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    let farcasterVotes = null;
    
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
        
        // Try to get reactions for this cast
        if (castFid > 0 || castHash) {
          // Get likes (upvotes)
          const likesResponse = await fetch(
            `${HUBBLE_HTTP_URL}/v1/castReactions?fid=${castFid}&hash=${castHash}&reactionType=1`, 
            { method: 'GET' }
          );
          
          // Get dislikes (downvotes)
          const dislikesResponse = await fetch(
            `${HUBBLE_HTTP_URL}/v1/castReactions?fid=${castFid}&hash=${castHash}&reactionType=4`, 
            { method: 'GET' }
          );
          
          if (likesResponse.ok && dislikesResponse.ok) {
            const likesData = await likesResponse.json();
            const dislikesData = await dislikesResponse.json();
            
            const votes = [];
            
            // Process likes
            if (likesData && likesData.reactions && Array.isArray(likesData.reactions)) {
              likesData.reactions.forEach((reaction: any) => {
                votes.push({
                  userId: reaction.fid,
                  value: 1,
                  timestamp: reaction.timestamp || Date.now()
                });
              });
            }
            
            // Process dislikes
            if (dislikesData && dislikesData.reactions && Array.isArray(dislikesData.reactions)) {
              dislikesData.reactions.forEach((reaction: any) => {
                votes.push({
                  userId: reaction.fid,
                  value: -1,
                  timestamp: reaction.timestamp || Date.now()
                });
              });
            }
            
            if (votes.length > 0) {
              farcasterVotes = votes;
              console.log(`Found ${votes.length} votes for cast ${castId} from Farcaster`);
            }
          }
        }
      }
    } catch (farcasterError) {
      console.error('Error fetching votes from Farcaster:', farcasterError);
    }
    
    // If we got votes from Farcaster, use those
    if (farcasterVotes && farcasterVotes.length > 0) {
      return NextResponse.json({
        success: true,
        votes: farcasterVotes,
        source: 'farcaster'
      });
    }
    
    // Fallback to local storage
    const votes = getVotes();
    const castVotes = votes[castId] || [];
    
    return NextResponse.json({
      success: true,
      votes: castVotes,
      source: 'local'
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
} 
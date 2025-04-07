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
    
    const votes = getVotes();
    const castVotes = votes[castId] || [];
    
    // Check if user already voted on this cast
    const existingVoteIndex = castVotes.findIndex((v: Vote) => v.userId === userId);
    
    if (existingVoteIndex !== -1) {
      const existingVote = castVotes[existingVoteIndex];
      
      // If the vote is the same, remove it (toggle off)
      if (existingVote.value === value) {
        castVotes.splice(existingVoteIndex, 1);
        updateUserVoteStats(userId, targetUserId, value, true);
      } else {
        // If the vote is different, update it
        castVotes[existingVoteIndex] = {
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
      castVotes.push({
        userId,
        value,
        timestamp: Date.now()
      });
      
      // Update user stats
      updateUserVoteStats(userId, targetUserId, value);
    }
    
    // Save updated votes
    votes[castId] = castVotes;
    saveVotes(votes);
    
    return NextResponse.json({
      success: true,
      votes: castVotes
    });
  } catch (error) {
    console.error('Error handling vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process vote' },
      { status: 500 }
    );
  }
} 
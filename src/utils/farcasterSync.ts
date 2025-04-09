import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CommentData } from '@/types/social';

// Path to the comments JSON file
const COMMENTS_DB_PATH = path.join(process.cwd(), 'data', 'comments.json');

/**
 * Load comments from the local JSON file
 */
function getComments(): Record<string, CommentData[]> {
  if (!fs.existsSync(COMMENTS_DB_PATH)) {
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

/**
 * Save comments to the local JSON file
 */
function saveComments(comments: Record<string, CommentData[]>) {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(COMMENTS_DB_PATH, JSON.stringify(comments, null, 2));
}

/**
 * Sync comments from local storage to Farcaster Hubble node
 * 
 * @param hubbleUrl The URL of the Hubble node to sync with
 * @returns Object containing success status and stats
 */
export async function syncCommentsToFarcaster(hubbleUrl: string = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281'): Promise<{
  success: boolean;
  totalComments: number;
  synced: number;
  failed: number;
  errors: string[];
}> {
  // Tracking variables
  const stats = {
    success: false,
    totalComments: 0,
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  // Check if Neynar API is enabled
  if (process.env.NEXT_PUBLIC_USE_NEYNAR_API === 'true' || process.env.NEXT_PUBLIC_NEYNAR_API_KEY) {
    stats.errors.push('Sync to Farcaster is not available when using Neynar API. Use Neynar SDK or API directly to post content.');
    return stats;
  }
  
  try {
    // First, check if the Hubble node is available
    const infoResponse = await fetch(`${hubbleUrl}/v1/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!infoResponse.ok) {
      stats.errors.push(`Hubble node not available: ${infoResponse.status} ${infoResponse.statusText}`);
      return stats;
    }
    
    // Load all comments from the local storage
    const commentsObj = getComments();
    let totalComments = 0;
    
    // Count total comments
    Object.values(commentsObj).forEach(commentsArray => {
      totalComments += commentsArray.length;
    });
    
    stats.totalComments = totalComments;
    
    if (totalComments === 0) {
      stats.success = true;
      return stats;
    }
    
    // Process each cast's comments
    for (const [castId, comments] of Object.entries(commentsObj)) {
      // Extract FID and hash from the castId if possible
      const castFid = parseInt(castId.split('-')[0]) || 0;
      const castHash = castId.includes('-') ? castId.split('-')[1] : castId;
      
      // Skip if we can't determine the target cast properly
      if (castFid === 0 && !castHash) {
        stats.errors.push(`Invalid cast ID format: ${castId}`);
        stats.failed += comments.length;
        continue;
      }
      
      // Process each comment for this cast
      for (const comment of comments) {
        try {
          // Check if this comment is already synced (has a Farcaster hash-like ID)
          // Farcaster hashes typically start with "0x"
          if (comment.id.startsWith('0x') && comment.id.length > 10) {
            console.log(`Comment ${comment.id} appears to be already synced to Farcaster`);
            stats.synced++;
            continue;
          }
          
          // Process as a top-level comment or a reply
          if (!comment.parentId) {
            // This is a top-level comment (direct reply to a cast)
            const response = await fetch(`${hubbleUrl}/v1/submitReaction`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: 'REACTION_TYPE_REPLY',
                fid: comment.authorFid,
                targetCastId: {
                  fid: castFid,
                  hash: castHash
                },
                replyBody: {
                  text: comment.text
                }
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              
              // Update the comment ID if we got a hash back
              if (result && result.hash) {
                comment.id = result.hash;
                stats.synced++;
              } else {
                stats.failed++;
                stats.errors.push(`No hash returned for comment ${comment.id}`);
              }
            } else {
              // Try alternative method - submit as a cast with parent reference
              const altResponse = await fetch(`${hubbleUrl}/v1/submitMessage`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  type: 'MESSAGE_TYPE_CAST_ADD',
                  fid: comment.authorFid,
                  castAddBody: {
                    text: comment.text,
                    mentions: [],
                    mentionsPositions: [],
                    parentCastId: {
                      fid: castFid,
                      hash: castHash
                    }
                  }
                })
              });
              
              if (altResponse.ok) {
                const altResult = await altResponse.json();
                if (altResult && altResult.hash) {
                  comment.id = altResult.hash;
                  stats.synced++;
                } else {
                  stats.failed++;
                  stats.errors.push(`No hash returned for comment ${comment.id} (alt method)`);
                }
              } else {
                stats.failed++;
                stats.errors.push(`Failed to sync comment ${comment.id}: ${response.status}`);
              }
            }
          } else {
            // This is a reply to another comment
            // Find the parent comment
            const parentComment = comments.find(c => c.id === comment.parentId);
            
            if (!parentComment) {
              stats.failed++;
              stats.errors.push(`Parent comment ${comment.parentId} not found for ${comment.id}`);
              continue;
            }
            
            // Check if parent has been synced (has Farcaster hash)
            if (!parentComment.id.startsWith('0x')) {
              stats.failed++;
              stats.errors.push(`Parent comment ${comment.parentId} not yet synced for ${comment.id}`);
              continue;
            }
            
            // Submit as a reply to the parent comment
            const response = await fetch(`${hubbleUrl}/v1/submitMessage`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: 'MESSAGE_TYPE_CAST_ADD',
                fid: comment.authorFid,
                castAddBody: {
                  text: comment.text,
                  mentions: [],
                  mentionsPositions: [],
                  parentCastId: {
                    fid: parentComment.authorFid,
                    hash: parentComment.id.startsWith('0x') ? parentComment.id.substring(2) : parentComment.id
                  }
                }
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result && result.hash) {
                comment.id = result.hash;
                stats.synced++;
              } else {
                stats.failed++;
                stats.errors.push(`No hash returned for reply ${comment.id}`);
              }
            } else {
              stats.failed++;
              stats.errors.push(`Failed to sync reply ${comment.id}: ${response.status}`);
            }
          }
          
          // Sleep briefly to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          stats.failed++;
          stats.errors.push(`Error processing comment ${comment.id}: ${error}`);
          console.error(`Error syncing comment ${comment.id}:`, error);
        }
      }
    }
    
    // Save updated comments with new Farcaster IDs
    saveComments(commentsObj);
    
    stats.success = stats.synced > 0;
    return stats;
    
  } catch (error) {
    stats.errors.push(`General error: ${error}`);
    console.error('Error syncing comments to Farcaster:', error);
    return stats;
  }
}

/**
 * Retrieve comments for a cast from Farcaster
 * 
 * @param castId The ID of the cast to get comments for
 * @param hubbleUrl The URL of the Hubble node
 * @returns Array of comments if found
 */
export async function getCommentsFromFarcaster(
  castId: string,
  hubbleUrl: string = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281'
): Promise<{
  success: boolean,
  comments?: CommentData[]
}> {
  try {
    // Extract FID and hash from the castId
    const castFid = parseInt(castId.split('-')[0]) || 0;
    const castHash = castId.includes('-') ? castId.split('-')[1] : castId;
    
    if (castFid === 0 && !castHash) {
      return { success: false };
    }
    
    // Check if Hubble is available
    try {
      const infoResponse = await fetch(`${hubbleUrl}/v1/info`, { method: 'GET' });
      if (!infoResponse.ok) {
        return { success: false };
      }
    } catch (error) {
      return { success: false };
    }
    
    // Get reactions for the cast
    const response = await fetch(`${hubbleUrl}/v1/castReactions?fid=${castFid}&hash=${castHash}&reactionType=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return { success: false };
    }
    
    const result = await response.json();
    
    if (!result || !result.reactions || !Array.isArray(result.reactions)) {
      return { success: false };
    }
    
    // Map Farcaster reactions to our comment format
    const comments: CommentData[] = result.reactions.map((reaction: any) => ({
      id: reaction.hash || uuidv4(),
      text: reaction.text || '',
      authorFid: reaction.fid || 0,
      timestamp: reaction.timestamp || Date.now(),
      votes: [],
      replies: []
    }));
    
    return {
      success: true,
      comments
    };
  } catch (error) {
    console.error('Error getting comments from Farcaster:', error);
    return { success: false };
  }
}

// Path to the casts JSON file
const CASTS_DB_PATH = path.join(process.cwd(), 'data', 'casts.json');

/**
 * Load casts from the local JSON file
 */
function getCasts(): any[] {
  if (!fs.existsSync(CASTS_DB_PATH)) {
    return [];
  }
  try {
    const data = fs.readFileSync(CASTS_DB_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading casts:', error);
    return [];
  }
}

/**
 * Save casts to the local JSON file
 */
function saveCasts(casts: any[]) {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(CASTS_DB_PATH, JSON.stringify(casts, null, 2));
}

/**
 * Sync casts from local storage to Farcaster Hubble node
 * 
 * @param hubbleUrl The URL of the Hubble node to sync with
 * @returns Object containing success status and stats
 */
export async function syncCastsToFarcaster(hubbleUrl: string = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281'): Promise<{
  success: boolean;
  totalCasts: number;
  synced: number;
  failed: number;
  errors: string[];
}> {
  // Tracking variables
  const stats = {
    success: false,
    totalCasts: 0,
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  // Check if Neynar API is enabled
  if (process.env.NEXT_PUBLIC_USE_NEYNAR_API === 'true' || process.env.NEXT_PUBLIC_NEYNAR_API_KEY) {
    stats.errors.push('Sync to Farcaster is not available when using Neynar API. Use Neynar SDK or API directly to post content.');
    return stats;
  }
  
  try {
    // First, check if the Hubble node is available
    const infoResponse = await fetch(`${hubbleUrl}/v1/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!infoResponse.ok) {
      stats.errors.push(`Hubble node not available: ${infoResponse.status} ${infoResponse.statusText}`);
      return stats;
    }
    
    // Load all casts from local storage
    const casts = getCasts();
    stats.totalCasts = casts.length;
    
    if (casts.length === 0) {
      stats.success = true;
      return stats;
    }
    
    // Process each cast
    for (const cast of casts) {
      try {
        // Check if this cast is already synced (has a Farcaster hash-like ID)
        if (cast.hash && cast.hash.startsWith('0x') && cast.hash.length > 10) {
          console.log(`Cast ${cast.id} appears to be already synced to Farcaster with hash ${cast.hash}`);
          stats.synced++;
          continue;
        }
        
        // Submit the cast to Farcaster
        const response = await fetch(`${hubbleUrl}/v1/submitMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'MESSAGE_TYPE_CAST_ADD',
            fid: cast.fid,
            castAddBody: {
              text: cast.data.text,
              mentions: cast.data.mentions || [],
              mentionsPositions: cast.data.mentionsPositions || [],
              embeds: cast.data.embeds || []
            }
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          
          // Update the cast hash if we got it back
          if (result && result.hash) {
            cast.hash = result.hash;
            stats.synced++;
          } else {
            stats.failed++;
            stats.errors.push(`No hash returned for cast ${cast.id}`);
          }
        } else {
          // Try alternative endpoint for different Hubble versions
          const altResponse = await fetch(`${hubbleUrl}/v1/submitCast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fid: cast.fid,
              text: cast.data.text,
              mentions: cast.data.mentions || [],
              mentionsPositions: cast.data.mentionsPositions || [],
              embeds: cast.data.embeds || []
            })
          });
          
          if (altResponse.ok) {
            const altResult = await altResponse.json();
            if (altResult && altResult.hash) {
              cast.hash = altResult.hash;
              stats.synced++;
            } else {
              stats.failed++;
              stats.errors.push(`No hash returned for cast ${cast.id} (alt method)`);
            }
          } else {
            stats.failed++;
            stats.errors.push(`Failed to sync cast ${cast.id}: ${response.status}`);
          }
        }
        
        // Sleep briefly to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        stats.failed++;
        stats.errors.push(`Error processing cast ${cast.id}: ${error}`);
        console.error(`Error syncing cast ${cast.id}:`, error);
      }
    }
    
    // Save updated casts with new Farcaster hashes
    saveCasts(casts);
    
    stats.success = stats.synced > 0;
    return stats;
    
  } catch (error) {
    stats.errors.push(`General error: ${error}`);
    console.error('Error syncing casts to Farcaster:', error);
    return stats;
  }
}

// Path to the votes JSON file
const VOTES_DB_PATH = path.join(process.cwd(), 'data', 'votes.json');

/**
 * Load votes from the local JSON file
 */
function getVotes(): any {
  if (!fs.existsSync(VOTES_DB_PATH)) {
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

/**
 * Save votes to the local JSON file
 */
function saveVotes(votes: any) {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(VOTES_DB_PATH, JSON.stringify(votes, null, 2));
}

/**
 * Sync votes from local storage to Farcaster Hubble node as reactions
 * 
 * @param hubbleUrl The URL of the Hubble node to sync with
 * @returns Object containing success status and stats
 */
export async function syncVotesToFarcaster(hubbleUrl: string = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281'): Promise<{
  success: boolean;
  totalVotes: number;
  synced: number;
  failed: number;
  errors: string[];
}> {
  // Tracking variables
  const stats = {
    success: false,
    totalVotes: 0,
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  // Check if Neynar API is enabled
  if (process.env.NEXT_PUBLIC_USE_NEYNAR_API === 'true' || process.env.NEXT_PUBLIC_NEYNAR_API_KEY) {
    stats.errors.push('Sync to Farcaster is not available when using Neynar API. Use Neynar SDK or API directly to post content.');
    return stats;
  }
  
  try {
    // First, check if the Hubble node is available
    const infoResponse = await fetch(`${hubbleUrl}/v1/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!infoResponse.ok) {
      stats.errors.push(`Hubble node not available: ${infoResponse.status} ${infoResponse.statusText}`);
      return stats;
    }
    
    // Load all votes from local storage
    const votes = getVotes();
    let totalVotes = 0;
    
    // Count total votes
    Object.values(votes).forEach((castVotes: any) => {
      if (Array.isArray(castVotes)) {
        totalVotes += castVotes.length;
      }
    });
    
    stats.totalVotes = totalVotes;
    
    if (totalVotes === 0) {
      stats.success = true;
      return stats;
    }
    
    // Process each cast's votes
    for (const [castId, castVotes] of Object.entries(votes)) {
      if (!Array.isArray(castVotes)) continue;
      
      // Extract FID and hash from the castId if possible
      const castFid = parseInt(castId.split('-')[0]) || 0;
      const castHash = castId.includes('-') ? castId.split('-')[1] : castId;
      
      // Skip if we can't determine the target cast properly
      if (castFid === 0 && !castHash) {
        stats.errors.push(`Invalid cast ID format: ${castId}`);
        stats.failed += castVotes.length;
        continue;
      }
      
      // Process each vote for this cast
      for (const vote of castVotes) {
        try {
          // Skip if no userId (FID) is available
          if (!vote.userId) {
            stats.failed++;
            stats.errors.push(`Vote missing userId/FID`);
            continue;
          }
          
          // Map vote value to Farcaster reaction type
          // 1 (upvote) = REACTION_TYPE_LIKE (1)
          // -1 (downvote) = REACTION_TYPE_DISLIKE (4)
          const reactionType = vote.value === 1 ? 'REACTION_TYPE_LIKE' : 'REACTION_TYPE_DISLIKE';
          const reactionValue = vote.value === 1 ? 1 : 4;
          
          // Submit as a reaction
          const response = await fetch(`${hubbleUrl}/v1/submitReaction`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: reactionType,
              fid: vote.userId,
              targetCastId: {
                fid: castFid,
                hash: castHash
              }
            })
          });
          
          if (response.ok) {
            stats.synced++;
          } else {
            // Try alternative endpoint for different reaction values
            const altResponse = await fetch(`${hubbleUrl}/v1/submitReaction`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                reactionType: reactionValue,
                fid: vote.userId,
                targetCastId: {
                  fid: castFid,
                  hash: castHash
                }
              })
            });
            
            if (altResponse.ok) {
              stats.synced++;
            } else {
              stats.failed++;
              stats.errors.push(`Failed to sync vote from user ${vote.userId} on cast ${castId}`);
            }
          }
          
          // Sleep briefly to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          stats.failed++;
          stats.errors.push(`Error processing vote: ${error}`);
          console.error('Error syncing vote:', error);
        }
      }
    }
    
    stats.success = stats.synced > 0;
    return stats;
    
  } catch (error) {
    stats.errors.push(`General error: ${error}`);
    console.error('Error syncing votes to Farcaster:', error);
    return stats;
  }
}

/**
 * Sync follow relationships from local storage to Farcaster Hubble node
 * 
 * @param hubbleUrl The URL of the Hubble node to sync with
 * @returns Object containing success status and stats
 */
export async function syncFollowsToFarcaster(hubbleUrl: string = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281'): Promise<{
  success: boolean;
  totalFollows: number;
  synced: number;
  failed: number;
  errors: string[];
}> {
  // Tracking variables
  const stats = {
    success: false,
    totalFollows: 0,
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  // Check if Neynar API is enabled
  if (process.env.NEXT_PUBLIC_USE_NEYNAR_API === 'true' || process.env.NEXT_PUBLIC_NEYNAR_API_KEY) {
    stats.errors.push('Sync to Farcaster is not available when using Neynar API. Use Neynar SDK or API directly to post content.');
    return stats;
  }
  
  try {
    // First, check if the Hubble node is available
    const infoResponse = await fetch(`${hubbleUrl}/v1/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!infoResponse.ok) {
      stats.errors.push(`Hubble node not available: ${infoResponse.status} ${infoResponse.statusText}`);
      return stats;
    }
    
    // Path to the email users JSON file
    const USERS_DB_PATH = path.join(process.cwd(), 'data', 'email-users.json');
    
    // Load all users from local storage
    if (!fs.existsSync(USERS_DB_PATH)) {
      stats.errors.push(`Users file not found: ${USERS_DB_PATH}`);
      return stats;
    }
    
    const users = JSON.parse(fs.readFileSync(USERS_DB_PATH, 'utf8') || '[]');
    
    // Process each user's follows
    let totalFollows = 0;
    
    for (const user of users) {
      if (!user.following || !Array.isArray(user.following) || user.following.length === 0) {
        continue;
      }
      
      totalFollows += user.following.length;
      
      // Skip if user doesn't have a valid FID
      if (!user.fid) {
        stats.failed += user.following.length;
        stats.errors.push(`User ${user.username || user.id} missing FID, skipping ${user.following.length} follows`);
        continue;
      }
      
      // Process each follow
      for (const targetFid of user.following) {
        try {
          // Submit as a "follow" link
          const response = await fetch(`${hubbleUrl}/v1/submitLink`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'LINK_TYPE_FOLLOW',
              fid: user.fid,
              targetFid: targetFid
            })
          });
          
          if (response.ok) {
            stats.synced++;
          } else {
            // Try alternative submission format
            const altResponse = await fetch(`${hubbleUrl}/v1/submitMessage`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: 'MESSAGE_TYPE_LINK_ADD',
                fid: user.fid,
                linkBody: {
                  type: 'follow',
                  targetFid: targetFid
                }
              })
            });
            
            if (altResponse.ok) {
              stats.synced++;
            } else {
              stats.failed++;
              stats.errors.push(`Failed to sync follow: ${user.fid} → ${targetFid}`);
            }
          }
          
          // Sleep briefly to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          stats.failed++;
          stats.errors.push(`Error processing follow: ${error}`);
          console.error('Error syncing follow:', error);
        }
      }
    }
    
    stats.totalFollows = totalFollows;
    stats.success = stats.synced > 0;
    return stats;
    
  } catch (error) {
    stats.errors.push(`General error: ${error}`);
    console.error('Error syncing follows to Farcaster:', error);
    return stats;
  }
}

/**
 * Sync forum topics from local storage to Farcaster Hubble node
 * 
 * @param hubbleUrl The URL of the Hubble node to sync with
 * @returns Object containing success status and stats
 */
export async function syncForumTopicsToFarcaster(hubbleUrl: string = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281'): Promise<{
  success: boolean;
  totalTopics: number;
  synced: number;
  failed: number;
  errors: string[];
}> {
  // Tracking variables
  const stats = {
    success: false,
    totalTopics: 0,
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  try {
    // First, check if the Hubble node is available
    const infoResponse = await fetch(`${hubbleUrl}/v1/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!infoResponse.ok) {
      stats.errors.push(`Hubble node not available: ${infoResponse.status} ${infoResponse.statusText}`);
      return stats;
    }
    
    // Load topics from file
    const fs = require('fs');
    const path = require('path');
    const topicsFilePath = path.join(process.cwd(), 'data', 'forum-topics.json');
    
    if (!fs.existsSync(topicsFilePath)) {
      stats.errors.push('Topics file not found');
      return stats;
    }
    
    const fileData = fs.readFileSync(topicsFilePath, 'utf8');
    const topics = JSON.parse(fileData);
    
    stats.totalTopics = topics.length;
    
    if (topics.length === 0) {
      stats.success = true;
      return stats;
    }
    
    // Process each topic
    for (const topic of topics) {
      try {
        // Skip if already synced (has a Farcaster hash)
        if (topic.farcasterHash && topic.farcasterHash.startsWith('0x') && topic.farcasterHash.length > 10) {
          console.log(`Topic ${topic.id} appears to be already synced to Farcaster with hash ${topic.farcasterHash}`);
          stats.synced++;
          continue;
        }
        
        // Submit the topic to Farcaster as a cast
        const response = await fetch(`${hubbleUrl}/v1/submitMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'MESSAGE_TYPE_CAST_ADD',
            fid: topic.authorFid,
            castAddBody: {
              text: `${topic.title}\n\n${topic.content.substring(0, 280)}${topic.content.length > 280 ? '...' : ''}`,
              mentions: [],
              mentionsPositions: [],
              embeds: []
            }
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Topic submitted to Farcaster:', result);
          
          // Save the Farcaster hash back to the topic
          if (result.hash) {
            topic.farcasterHash = result.hash;
            stats.synced++;
          }
        } else {
          const errorText = await response.text();
          stats.errors.push(`Failed to sync topic ${topic.id}: ${errorText}`);
          stats.failed++;
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push(`Error processing topic: ${error}`);
        console.error('Error syncing topic:', error);
      }
    }
    
    // Save updated topics with Farcaster hashes back to file
    fs.writeFileSync(topicsFilePath, JSON.stringify(topics, null, 2));
    
    stats.success = stats.synced > 0;
    return stats;
    
  } catch (error) {
    stats.errors.push(`General error: ${error}`);
    console.error('Error syncing topics to Farcaster:', error);
    return stats;
  }
}

/**
 * Sync research contributions from local storage to Farcaster Hubble node
 * 
 * @param hubbleUrl The URL of the Hubble node to sync with
 * @returns Object containing success status and stats
 */
export async function syncResearchToFarcaster(hubbleUrl: string = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281'): Promise<{
  success: boolean;
  totalContributions: number;
  synced: number;
  failed: number;
  errors: string[];
}> {
  // Tracking variables
  const stats = {
    success: false,
    totalContributions: 0,
    synced: 0,
    failed: 0,
    errors: [] as string[]
  };
  
  try {
    // First, check if the Hubble node is available
    const infoResponse = await fetch(`${hubbleUrl}/v1/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!infoResponse.ok) {
      stats.errors.push(`Hubble node not available: ${infoResponse.status} ${infoResponse.statusText}`);
      return stats;
    }
    
    // Get research contributions (in real implementation, this would use the actual storage)
    // For this demo, we'll fetch them via API
    const contributionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/research/contributions`);
    
    if (!contributionsResponse.ok) {
      stats.errors.push(`Failed to fetch contributions: ${contributionsResponse.status} ${contributionsResponse.statusText}`);
      return stats;
    }
    
    const contributionsData = await contributionsResponse.json();
    const contributions = contributionsData.success ? contributionsData.contributions : [];
    
    stats.totalContributions = contributions.length;
    
    if (contributions.length === 0) {
      stats.success = true;
      return stats;
    }
    
    // Process each contribution
    for (const contribution of contributions) {
      try {
        // Skip if already synced
        if (contribution.farcasterHash && contribution.farcasterHash.startsWith('0x') && contribution.farcasterHash.length > 10) {
          console.log(`Contribution ${contribution.id} appears to be already synced to Farcaster with hash ${contribution.farcasterHash}`);
          stats.synced++;
          continue;
        }
        
        // Submit the contribution to Farcaster as a cast
        const response = await fetch(`${hubbleUrl}/v1/submitMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'MESSAGE_TYPE_CAST_ADD',
            fid: contribution.authorFid,
            castAddBody: {
              text: `Research: ${contribution.title}\n\n${contribution.abstract.substring(0, 240)}${contribution.abstract.length > 240 ? '...' : ''}\n\nTags: ${contribution.tags.join(', ')}`,
              mentions: [],
              mentionsPositions: [],
              embeds: []
            }
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Contribution submitted to Farcaster:', result);
          
          // In a real implementation, update the contribution with the Farcaster hash
          if (result.hash) {
            // Update contribution hash
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/research/contributions/${contribution.id}/farcaster`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                farcasterHash: result.hash
              })
            });
            
            stats.synced++;
          }
        } else {
          const errorText = await response.text();
          stats.errors.push(`Failed to sync contribution ${contribution.id}: ${errorText}`);
          stats.failed++;
        }
      } catch (error) {
        stats.failed++;
        stats.errors.push(`Error processing contribution: ${error}`);
        console.error('Error syncing contribution:', error);
      }
    }
    
    stats.success = stats.synced > 0;
    return stats;
    
  } catch (error) {
    stats.errors.push(`General error: ${error}`);
    console.error('Error syncing contributions to Farcaster:', error);
    return stats;
  }
}

/**
 * Sync all local content to Farcaster in one operation
 * 
 * @param hubbleUrl The URL of the Hubble node to sync with
 * @returns Object containing success status and stats for each content type
 */
export async function syncAllToFarcaster(hubbleUrl: string = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281'): Promise<{
  success: boolean;
  stats: {
    casts: {
      total: number;
      synced: number;
      failed: number;
    };
    votes: {
      total: number;
      synced: number;
      failed: number;
    };
    follows: {
      total: number;
      synced: number;
      failed: number;
    };
    topics: {
      total: number;
      synced: number;
      failed: number;
    };
    research: {
      total: number;
      synced: number;
      failed: number;
    };
  };
  errors: string[];
}> {
  const result = {
    success: false,
    stats: {
      casts: { total: 0, synced: 0, failed: 0 },
      votes: { total: 0, synced: 0, failed: 0 },
      follows: { total: 0, synced: 0, failed: 0 },
      topics: { total: 0, synced: 0, failed: 0 },
      research: { total: 0, synced: 0, failed: 0 }
    },
    errors: [] as string[]
  };
  
  // Check if Neynar API is enabled
  if (process.env.NEXT_PUBLIC_USE_NEYNAR_API === 'true' || process.env.NEXT_PUBLIC_NEYNAR_API_KEY) {
    result.errors.push('Sync to Farcaster is not available when using Neynar API. Use Neynar SDK or API directly to post content.');
    return result;
  }
  
  try {
    // Check if the Hubble node is available
    const infoResponse = await fetch(`${hubbleUrl}/v1/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!infoResponse.ok) {
      result.errors.push(`Hubble node not available: ${infoResponse.status} ${infoResponse.statusText}`);
      return result;
    }
    
    // Sync casts
    const castsResult = await syncCastsToFarcaster(hubbleUrl);
    result.stats.casts.total = castsResult.totalCasts;
    result.stats.casts.synced = castsResult.synced;
    result.stats.casts.failed = castsResult.failed;
    result.errors.push(...castsResult.errors);
    
    // Sync votes
    const votesResult = await syncVotesToFarcaster(hubbleUrl);
    result.stats.votes.total = votesResult.totalVotes;
    result.stats.votes.synced = votesResult.synced;
    result.stats.votes.failed = votesResult.failed;
    result.errors.push(...votesResult.errors);
    
    // Sync follows
    const followsResult = await syncFollowsToFarcaster(hubbleUrl);
    result.stats.follows.total = followsResult.totalFollows;
    result.stats.follows.synced = followsResult.synced;
    result.stats.follows.failed = followsResult.failed;
    result.errors.push(...followsResult.errors);
    
    // Sync forum topics
    const topicsResult = await syncForumTopicsToFarcaster(hubbleUrl);
    result.stats.topics.total = topicsResult.totalTopics;
    result.stats.topics.synced = topicsResult.synced;
    result.stats.topics.failed = topicsResult.failed;
    result.errors.push(...topicsResult.errors);
    
    // Sync research contributions
    const researchResult = await syncResearchToFarcaster(hubbleUrl);
    result.stats.research.total = researchResult.totalContributions;
    result.stats.research.synced = researchResult.synced;
    result.stats.research.failed = researchResult.failed;
    result.errors.push(...researchResult.errors);
    
    // Consider sync successful if any content was synced
    result.success = 
      castsResult.success || 
      votesResult.success || 
      followsResult.success || 
      topicsResult.success || 
      researchResult.success;
    
    return result;
  } catch (error) {
    result.errors.push(`General error during sync: ${error}`);
    console.error('Error during complete sync:', error);
    return result;
  }
} 
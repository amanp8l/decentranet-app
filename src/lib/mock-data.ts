import { v4 as uuidv4 } from 'uuid';

// Generate a mock user for development purposes
export function generateMockUser(username = '', fid = 0) {
  if (!username) {
    username = `user_${Math.floor(Math.random() * 10000)}`;
  }
  
  if (!fid) {
    // Generate a random 10-digit FID
    fid = Math.floor(1000000000 + Math.random() * 9000000000);
  }
  
  return {
    id: uuidv4(),
    username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    fid,
    pfp: null,
    bio: `Mock user with FID: ${fid}`,
    followers: Math.floor(Math.random() * 100),
    following: Math.floor(Math.random() * 50),
    verifications: [],
    authToken: uuidv4(),
    createdAt: new Date().toISOString()
  };
} 
import { NextRequest } from 'next/server';

// Mock user store - in production, this would be retrieved from a database
const mockUsers = [
  {
    fid: 2042580739,
    displayName: 'Dr. Sarah Miller',
    authToken: 'auth-token-sarah'
  },
  {
    fid: 4927644238,
    displayName: 'Prof. Kenneth Robinson',
    authToken: 'auth-token-kenneth'
  },
  {
    fid: 6269597478,
    displayName: 'Dr. Emily Thompson',
    authToken: 'auth-token-emily'
  }
];

// Get the authenticated user from a request
export const getAuthenticatedUser = async (request: NextRequest) => {
  try {
    // Get auth token from cookie or Authorization header
    const authToken = request.cookies.get('authToken')?.value || 
      request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!authToken) {
      return null;
    }
    
    // Find user with matching auth token
    // In production, validate against database or auth service
    const user = mockUsers.find(u => u.authToken === authToken);
    
    return user || null;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}; 
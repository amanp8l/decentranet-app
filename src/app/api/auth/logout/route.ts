import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to user database file
const USER_DB_PATH = path.join(process.cwd(), 'data', 'email-users.json');

// Helper to get users from JSON file
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

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from the header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Find the user with this token and invalidate it
    const users = getUsers();
    const userIndex = users.findIndex((user: any) => user.authToken === token);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Invalidate the auth token
    users[userIndex].authToken = null;
    
    // Save updated users
    saveUsers(users);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
} 
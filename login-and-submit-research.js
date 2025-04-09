import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to data files
const USER_DB_PATH = path.join(__dirname, 'data', 'email-users.json');
const CONTRIBUTIONS_PATH = path.join(__dirname, 'data', 'research-contributions.json');

// API endpoint for the application
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Simulate a login for a user and get auth token
async function loginUser(user) {
  console.log(`Logging in as ${user.displayName} (${user.email})...`);
  
  try {
    // In a real app, we would make an actual login request
    // For this simulation, we'll just use the existing authToken
    
    // If you need to do a real login, uncommenting something like:
    /*
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        password: 'password123' // Assuming all users have the same password for simulation
      })
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.authToken;
    */
    
    // For simulation purposes, return the existing token
    return user.authToken;
  } catch (error) {
    console.error(`Error logging in as ${user.displayName}:`, error);
    return null;
  }
}

// Submit the user's research contribution
async function submitResearch(authToken, user, contribution) {
  console.log(`Submitting research for ${user.displayName}: ${contribution.title}`);
  
  try {
    // In a real app, we would make an actual API request to submit the research
    // For this simulation, we'll log the key details
    
    console.log(`[SIMULATION] User ${user.displayName} (FID: ${user.fid}) is submitting research:`);
    console.log(`Title: ${contribution.title}`);
    console.log(`Abstract: ${contribution.abstract.substring(0, 100)}...`);
    console.log(`Tags: ${contribution.tags.join(', ')}`);
    
    // Simulate a successful submission
    console.log(`[SIMULATION] Research successfully submitted to Farcaster network`);
    
    // If you need to make a real submission, uncommenting something like:
    /*
    const response = await fetch(`${API_URL}/research/contributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: contribution.title,
        abstract: contribution.abstract,
        content: contribution.content,
        authorFid: user.fid,
        authorName: user.displayName,
        tags: contribution.tags,
        links: contribution.links,
        collaborators: contribution.collaborators
      })
    });
    
    if (!response.ok) {
      throw new Error(`Submission failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Research successfully submitted with ID: ${data.contribution.id}`);
    return data.contribution;
    */
    
    return contribution;
  } catch (error) {
    console.error(`Error submitting research for ${user.displayName}:`, error);
    return null;
  }
}

// Main function to login users and submit research
async function loginAndSubmitResearch() {
  try {
    // Read existing users
    if (!fs.existsSync(USER_DB_PATH)) {
      console.error('User database file not found!');
      return;
    }
    
    const userData = fs.readFileSync(USER_DB_PATH, 'utf8');
    const users = JSON.parse(userData || '[]');
    
    if (users.length === 0) {
      console.error('No users found in database!');
      return;
    }
    
    // Read existing contributions
    if (!fs.existsSync(CONTRIBUTIONS_PATH)) {
      console.error('Contributions file not found!');
      return;
    }
    
    const contributionsData = fs.readFileSync(CONTRIBUTIONS_PATH, 'utf8');
    const contributions = JSON.parse(contributionsData || '[]');
    
    if (contributions.length === 0) {
      console.error('No contributions found!');
      return;
    }
    
    console.log(`Found ${users.length} users and ${contributions.length} contributions.`);
    console.log('Will process first 20 users...');
    
    // Get first 20 users (or all if less than 20)
    const targetUsers = users.slice(0, 20);
    
    // Process each user
    for (let i = 0; i < targetUsers.length; i++) {
      const user = targetUsers[i];
      const contribution = contributions[i]; // Match user with their contribution
      
      if (!contribution) {
        console.log(`No contribution found for user ${user.displayName}, skipping...`);
        continue;
      }
      
      console.log(`\n--- Processing user ${i+1}/${targetUsers.length} ---`);
      
      // Login as user
      const authToken = await loginUser(user);
      
      if (!authToken) {
        console.log(`Failed to login as ${user.displayName}, skipping...`);
        continue;
      }
      
      // Submit research
      await submitResearch(authToken, user, contribution);
      
      // Wait a bit between users to simulate real usage
      const delay = Math.floor(Math.random() * 1000) + 500; // 500-1500ms delay
      console.log(`Waiting ${delay}ms before next user...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.log(`\nSuccessfully processed ${targetUsers.length} users.`);
    
  } catch (error) {
    console.error('Error in loginAndSubmitResearch:', error);
  }
}

// Run the main function
loginAndSubmitResearch()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Fatal error:', err)); 
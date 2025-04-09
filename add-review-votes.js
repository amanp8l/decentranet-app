import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to data files
const USER_DB_PATH = path.join(__dirname, 'data', 'email-users.json');
const REVIEWS_PATH = path.join(__dirname, 'data', 'research-reviews.json');

// Main function to add votes to reviews
async function addReviewVotes() {
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
    
    // Read existing reviews
    if (!fs.existsSync(REVIEWS_PATH)) {
      console.error('Reviews file not found!');
      return;
    }
    
    const reviewsData = fs.readFileSync(REVIEWS_PATH, 'utf8');
    const reviews = JSON.parse(reviewsData || '[]');
    
    if (reviews.length === 0) {
      console.error('No reviews found!');
      return;
    }
    
    console.log(`Found ${users.length} users and ${reviews.length} reviews.`);
    
    // Get first 20 users (or all if less than 20)
    const targetUsers = users.slice(0, 20);
    let totalVoteCount = 0;
    
    // Each user will vote on 3-8 reviews (not their own)
    for (const user of targetUsers) {
      // How many reviews this user will vote on
      const userVoteCount = Math.floor(Math.random() * 6) + 3; // 3-8 votes
      console.log(`User ${user.displayName} (FID: ${user.fid}) will vote on ${userVoteCount} reviews`);
      
      // Find reviews this user can vote on (not their own)
      const availableReviews = reviews.filter(r => 
        r.reviewerFid !== user.fid && 
        // Check if user hasn't already voted on this review
        !r.votes.some(v => v.userId === user.fid)
      );
      
      if (availableReviews.length === 0) {
        console.log(`No available reviews for ${user.displayName} to vote on`);
        continue;
      }
      
      // Select random reviews to vote on
      const reviewsToVote = [];
      const tempAvailable = [...availableReviews];
      
      for (let i = 0; i < Math.min(userVoteCount, tempAvailable.length); i++) {
        const randomIndex = Math.floor(Math.random() * tempAvailable.length);
        reviewsToVote.push(tempAvailable[randomIndex]);
        tempAvailable.splice(randomIndex, 1);
      }
      
      // Add votes to selected reviews
      for (const review of reviewsToVote) {
        // Determine vote value: more likely to be upvote (1) than downvote (-1)
        // 80% chance of upvote, 20% chance of downvote
        const voteValue = Math.random() < 0.8 ? 1 : -1;
        
        // Add vote to review
        review.votes.push({
          userId: user.fid,
          value: voteValue,
          timestamp: Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000) // Random time in the past 5 days
        });
        
        totalVoteCount++;
        console.log(`Added ${voteValue > 0 ? 'upvote' : 'downvote'} to review by ${review.reviewerName}`);
      }
      
      // Simulating a delay between users
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Save the updated reviews with votes
    fs.writeFileSync(REVIEWS_PATH, JSON.stringify(reviews, null, 2));
    console.log(`Added a total of ${totalVoteCount} votes to reviews`);
    
  } catch (error) {
    console.error('Error in addReviewVotes:', error);
  }
}

// Run the main function
addReviewVotes()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Fatal error:', err)); 
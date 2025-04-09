import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to data files
const USER_DB_PATH = path.join(__dirname, 'data', 'email-users.json');
const CONTRIBUTIONS_PATH = path.join(__dirname, 'data', 'research-contributions.json');
const REVIEWS_PATH = path.join(__dirname, 'data', 'research-reviews.json');

// Simulate a user session with research activity
async function simulateUserSession(user, contributions, reviews) {
  // Logging in
  console.log(`\n==== ${user.displayName} (FID: ${user.fid}) logging in ====`);
  
  // View user's own contributions
  const userContributions = contributions.filter(c => c.authorFid === user.fid);
  console.log(`\nViewing my ${userContributions.length} research contributions:`);
  
  for (const contribution of userContributions) {
    console.log(`\n- "${contribution.title}"`);
    console.log(`  Status: ${contribution.status}`);
    
    // Get reviews for this contribution
    const contributionReviews = reviews.filter(r => r.contributionId === contribution.id);
    
    if (contributionReviews.length > 0) {
      console.log(`  ${contributionReviews.length} peer reviews received:`);
      
      // Calculate average rating
      const avgRating = contributionReviews.reduce((sum, r) => sum + r.rating, 0) / contributionReviews.length;
      console.log(`  Average rating: ${avgRating.toFixed(1)}/5`);
      
      // Show reviews summary
      for (const review of contributionReviews) {
        // Count upvotes and downvotes
        const upvotes = review.votes.filter(v => v.value === 1).length;
        const downvotes = review.votes.filter(v => v.value === -1).length;
        
        console.log(`    - Review by ${review.reviewerName}: ${review.rating}/5 stars (${upvotes} upvotes, ${downvotes} downvotes)`);
      }
    } else {
      console.log(`  No reviews yet`);
    }
  }
  
  // View reviews written by the user
  const userReviews = reviews.filter(r => r.reviewerFid === user.fid);
  console.log(`\nViewing ${userReviews.length} reviews I've written:`);
  
  for (const review of userReviews) {
    // Find the contribution this review is for
    const contribution = contributions.find(c => c.id === review.contributionId);
    if (contribution) {
      console.log(`\n- Review for "${contribution.title}" by ${contribution.authorName}`);
      console.log(`  My rating: ${review.rating}/5`);
      
      // Count votes received
      const upvotes = review.votes.filter(v => v.value === 1).length;
      const downvotes = review.votes.filter(v => v.value === -1).length;
      console.log(`  Votes received: ${upvotes} upvotes, ${downvotes} downvotes`);
    }
  }
  
  // Browse some other research
  console.log(`\nBrowsing other recent research:`);
  
  // Get 3 random contributions that are not by the user
  const otherContributions = contributions.filter(c => c.authorFid !== user.fid);
  const researchToView = [];
  const tempAvailable = [...otherContributions];
  
  for (let i = 0; i < Math.min(3, tempAvailable.length); i++) {
    const randomIndex = Math.floor(Math.random() * tempAvailable.length);
    researchToView.push(tempAvailable[randomIndex]);
    tempAvailable.splice(randomIndex, 1);
  }
  
  for (const contribution of researchToView) {
    console.log(`\n- "${contribution.title}" by ${contribution.authorName}`);
    console.log(`  Status: ${contribution.status}`);
    console.log(`  Tags: ${contribution.tags.join(', ')}`);
    
    // Check if user has already reviewed this contribution
    const userReview = reviews.find(r => r.contributionId === contribution.id && r.reviewerFid === user.fid);
    if (userReview) {
      console.log(`  I've reviewed this with a rating of ${userReview.rating}/5`);
    } else {
      console.log(`  I haven't reviewed this yet`);
    }
  }
  
  console.log(`\n==== ${user.displayName} logging out ====\n`);
}

// Main function to simulate research activity
async function simulateResearchActivity() {
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
    
    console.log(`Found ${users.length} users, ${contributions.length} contributions, and ${reviews.length} reviews.`);
    console.log('Simulating research activity for 5 random users...');
    
    // Simulate session for 5 random users
    const userIndices = [];
    while (userIndices.length < 5) {
      const randomIndex = Math.floor(Math.random() * 20); // First 20 users
      if (!userIndices.includes(randomIndex)) {
        userIndices.push(randomIndex);
      }
    }
    
    for (const userIndex of userIndices) {
      const user = users[userIndex];
      await simulateUserSession(user, contributions, reviews);
      
      // Small delay between users
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Simulation completed successfully.');
    
  } catch (error) {
    console.error('Error in simulateResearchActivity:', error);
  }
}

// Run the main function
simulateResearchActivity()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Fatal error:', err)); 
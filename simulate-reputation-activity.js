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

// Simulate a user viewing their reputation and tokens
async function simulateReputationActivity(user, contributions, reviews) {
  console.log(`\n==== ${user.displayName} (FID: ${user.fid}) logs in to check reputation and tokens ====`);
  
  // Display user's reputation and tokens
  console.log(`\nCurrent Reputation Score: ${user.reputationScore || 0}`);
  console.log(`Current Token Balance: ${user.tokenBalance || 0} DeSci Tokens`);
  
  // Display user's contributions and how they affect reputation
  const userContributions = contributions.filter(c => c.authorFid === user.fid);
  
  if (userContributions.length > 0) {
    console.log(`\nResearch Contributions (${userContributions.length}):`);
    
    for (const contribution of userContributions) {
      // Calculate contribution reputation impact
      let reputationImpact = 20; // Base reputation per contribution
      let tokenImpact = 50; // Base tokens per contribution
      
      if (contribution.status === 'peer_reviewed') {
        reputationImpact += 15;
        tokenImpact += 30;
      }
      
      if (contribution.status === 'verified') {
        reputationImpact += 30;
        tokenImpact += 70;
      }
      
      // Reviews received for this contribution
      const contributionReviews = reviews.filter(r => r.contributionId === contribution.id);
      const avgRating = contributionReviews.length > 0 
        ? contributionReviews.reduce((sum, r) => sum + r.rating, 0) / contributionReviews.length
        : 0;
      
      console.log(`- "${contribution.title}" (Status: ${contribution.status})`);
      console.log(`  Impact: +${reputationImpact} reputation, +${tokenImpact} tokens`);
      
      if (contributionReviews.length > 0) {
        console.log(`  Reviews: ${contributionReviews.length}, Avg Rating: ${avgRating.toFixed(1)}/5`);
      }
    }
  }
  
  // Display user's reviews and how they affect reputation
  const userReviews = reviews.filter(r => r.reviewerFid === user.fid);
  
  if (userReviews.length > 0) {
    console.log(`\nPeer Reviews Written (${userReviews.length}):`);
    
    for (const review of userReviews) {
      // Find the contribution this review is for
      const contribution = contributions.find(c => c.id === review.contributionId);
      
      // Calculate review reputation impact
      const baseReputationImpact = 10; // Base reputation per review
      const baseTokenImpact = 15; // Base tokens per review
      
      // Additional reputation from votes
      const upvotes = review.votes.filter(v => v.value === 1).length;
      const downvotes = review.votes.filter(v => v.value === -1).length;
      const voteReputationImpact = (upvotes * 2) - downvotes;
      const voteTokenImpact = upvotes * 2;
      
      if (contribution) {
        console.log(`- Review for "${contribution.title}" by ${contribution.authorName}`);
        console.log(`  My Rating: ${review.rating}/5, Votes: ${upvotes} upvotes, ${downvotes} downvotes`);
        console.log(`  Impact: +${baseReputationImpact} base reputation, +${voteReputationImpact} from votes`);
        console.log(`  Tokens: +${baseTokenImpact} base tokens, +${voteTokenImpact} from upvotes`);
      }
    }
  }
  
  // Display leaderboard position
  console.log(`\nChecking reputation leaderboard position...`);
  // This would be a function to check user's position in a leaderboard
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Simulate a token transaction (random)
  const actions = [
    { name: 'Nominate Research', tokens: -25, rep: 0 },
    { name: 'Sponsor Junior Researcher', tokens: -50, rep: +10 },
    { name: 'Endorse Research for Verification', tokens: -30, rep: +5 },
    { name: 'Host Research Workshop', tokens: -40, rep: +15 },
    { name: 'Submit for Conference', tokens: -35, rep: +8 }
  ];
  
  // Only show token actions if user has tokens
  if (user.tokenBalance && user.tokenBalance >= 50) {
    const actionIndex = Math.floor(Math.random() * actions.length);
    const action = actions[actionIndex];
    
    console.log(`\nPerforming token action: ${action.name}`);
    console.log(`  Cost: ${-action.tokens} tokens`);
    console.log(`  Reputation gain: +${action.rep}`);
    
    // Update user tokens and reputation
    user.tokenBalance += action.tokens;
    user.reputationScore += action.rep;
    
    console.log(`  New Token Balance: ${user.tokenBalance} DeSci Tokens`);
    console.log(`  New Reputation Score: ${user.reputationScore}`);
  }
  
  // Display user's reputation milestones and badges
  const reputationTiers = [
    { threshold: 100, name: 'Emerging Researcher' },
    { threshold: 200, name: 'Established Researcher' },
    { threshold: 300, name: 'Distinguished Researcher' },
    { threshold: 500, name: 'Leading Authority' },
    { threshold: 1000, name: 'Research Pioneer' }
  ];
  
  console.log(`\nReputation Status:`);
  
  // Find current tier
  let currentTier = null;
  let nextTier = null;
  
  for (let i = reputationTiers.length - 1; i >= 0; i--) {
    if (user.reputationScore >= reputationTiers[i].threshold) {
      currentTier = reputationTiers[i];
      nextTier = i < reputationTiers.length - 1 ? reputationTiers[i + 1] : null;
      break;
    } else if (i === 0 || user.reputationScore >= reputationTiers[i - 1].threshold) {
      currentTier = i > 0 ? reputationTiers[i - 1] : { threshold: 0, name: 'New Researcher' };
      nextTier = reputationTiers[i];
      break;
    }
  }
  
  if (currentTier) {
    console.log(`  Current Tier: ${currentTier.name}`);
    
    if (nextTier) {
      const pointsToNext = nextTier.threshold - user.reputationScore;
      console.log(`  Next Tier: ${nextTier.name} (${pointsToNext} points needed)`);
    } else {
      console.log(`  You've reached the highest reputation tier!`);
    }
  }
  
  // Badges based on activity
  console.log(`\nEarned Badges:`);
  
  const badges = [];
  
  // Contribution badges
  if (userContributions.length >= 1) {
    badges.push('Contributor');
  }
  if (userContributions.some(c => c.status === 'verified')) {
    badges.push('Verified Researcher');
  }
  
  // Review badges
  if (userReviews.length >= 3) {
    badges.push('Peer Reviewer');
  }
  if (userReviews.some(r => r.votes.filter(v => v.value === 1).length >= 3)) {
    badges.push('Helpful Reviewer');
  }
  
  // Specialty badges
  if (user.profile && user.profile.specialty) {
    badges.push(`${user.profile.specialty} Specialist`);
  }
  
  if (badges.length > 0) {
    for (const badge of badges) {
      console.log(`  - ${badge}`);
    }
  } else {
    console.log(`  No badges earned yet`);
  }
  
  console.log(`\n==== ${user.displayName} logs out ====\n`);
  
  return user;
}

// Main function to simulate reputation activity
async function simulateReputationActivities() {
  try {
    // Read existing users
    if (!fs.existsSync(USER_DB_PATH)) {
      console.error('User database file not found!');
      return;
    }
    
    const userData = fs.readFileSync(USER_DB_PATH, 'utf8');
    let users = JSON.parse(userData || '[]');
    
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
    
    // Read existing reviews
    if (!fs.existsSync(REVIEWS_PATH)) {
      console.error('Reviews file not found!');
      return;
    }
    
    const reviewsData = fs.readFileSync(REVIEWS_PATH, 'utf8');
    const reviews = JSON.parse(reviewsData || '[]');
    
    console.log(`Found ${users.length} users, ${contributions.length} contributions, and ${reviews.length} reviews.`);
    console.log('Simulating reputation and token activities for 5 random users...');
    
    // Select 5 random users to simulate activities for
    const userIndices = new Set();
    while (userIndices.size < 5 && userIndices.size < users.length) {
      const randomIndex = Math.floor(Math.random() * users.length);
      userIndices.add(randomIndex);
    }
    
    // Simulate activities for selected users
    for (const index of userIndices) {
      const user = users[index];
      
      // Simulate reputation activities
      const updatedUser = await simulateReputationActivity(user, contributions, reviews);
      
      // Update the user in the array
      users[index] = updatedUser;
      
      // Small delay between users
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Save the updated users (only if token actions were performed)
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2));
    console.log(`Successfully simulated reputation activities for ${userIndices.size} users.`);
    
  } catch (error) {
    console.error('Error in simulateReputationActivities:', error);
  }
}

// Run the main function
simulateReputationActivities()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Fatal error:', err)); 
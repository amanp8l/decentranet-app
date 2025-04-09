import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to data files
const USER_DB_PATH = path.join(__dirname, 'data', 'email-users.json');
const CONTRIBUTIONS_PATH = path.join(__dirname, 'data', 'research-contributions.json');
const REVIEWS_PATH = path.join(__dirname, 'data', 'research-reviews.json');

// Function to generate review content
function generateReviewContent(contribution) {
  const intro = [
    "This research makes a valuable contribution to the field.",
    "I've thoroughly examined this research contribution.",
    "Having reviewed this work carefully, I have several points to address.",
    "This paper presents interesting findings that deserve attention.",
    "As a specialist in this area, I find this research quite relevant."
  ][Math.floor(Math.random() * 5)];

  const strengthPoints = [
    "The methodology is robust and well-designed.",
    "The literature review is comprehensive and up-to-date.",
    "The statistical analysis is appropriate for the research questions.",
    "The conclusions are well-supported by the data presented.",
    "The paper addresses an important gap in current knowledge.",
    "The experimental design demonstrates careful planning.",
    "The discussion thoughtfully interprets the findings.",
    "The abstract effectively summarizes the key points.",
    "The research question is clearly articulated.",
    "The limitations are acknowledged appropriately."
  ];

  const weaknessPoints = [
    "Some methodological details could be more thoroughly explained.",
    "A larger sample size would strengthen the conclusions.",
    "Additional statistical tests might provide further insights.",
    "Some recent relevant literature appears to be missing.",
    "The implications for clinical practice could be expanded.",
    "Long-term follow-up data would enhance the findings.",
    "The control group selection process raises some questions.",
    "Certain confounding variables might not be fully addressed.",
    "The generalizability of the findings could be discussed further.",
    "Some figures would benefit from clearer labeling."
  ];

  const conclusion = [
    "Overall, this is a valuable contribution that advances our understanding in this field.",
    "Despite the minor limitations noted, this research represents important progress.",
    "I commend the authors for this well-executed study that offers new insights.",
    "This work has potential implications for both research and clinical practice.",
    "With some revisions, this research could have significant impact in the field."
  ][Math.floor(Math.random() * 5)];

  // Select 2-3 strength points
  const numStrengths = Math.floor(Math.random() * 2) + 2;
  const selectedStrengths = [];
  const tempStrengths = [...strengthPoints];
  
  for (let i = 0; i < numStrengths; i++) {
    const idx = Math.floor(Math.random() * tempStrengths.length);
    selectedStrengths.push(tempStrengths[idx]);
    tempStrengths.splice(idx, 1);
  }

  // Select 1-2 weakness points
  const numWeaknesses = Math.floor(Math.random() * 2) + 1;
  const selectedWeaknesses = [];
  const tempWeaknesses = [...weaknessPoints];
  
  for (let i = 0; i < numWeaknesses; i++) {
    const idx = Math.floor(Math.random() * tempWeaknesses.length);
    selectedWeaknesses.push(tempWeaknesses[idx]);
    tempWeaknesses.splice(idx, 1);
  }

  // Assemble the review
  let review = `${intro}\n\n## Strengths\n`;
  selectedStrengths.forEach(point => {
    review += `- ${point}\n`;
  });
  
  review += `\n## Areas for Improvement\n`;
  selectedWeaknesses.forEach(point => {
    review += `- ${point}\n`;
  });
  
  review += `\n${conclusion}`;
  return review;
}

// Generate a rating biased towards positive but realistic (scale: 1-5)
function generateRating() {
  // Weights: more likely to generate 4 or 5, but occasionally 3, rarely 1-2
  const weights = [0.05, 0.10, 0.20, 0.40, 0.25]; // For ratings 1-5
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulativeWeight += weights[i];
    if (random < cumulativeWeight) {
      return i + 1; // Ratings are 1-5, so add 1 to the index
    }
  }
  
  return 4; // Default fallback
}

// Main function to add reviews
async function addResearchReviews() {
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
    
    // Read existing reviews if they exist
    let existingReviews = [];
    if (fs.existsSync(REVIEWS_PATH)) {
      const reviewsData = fs.readFileSync(REVIEWS_PATH, 'utf8');
      existingReviews = JSON.parse(reviewsData || '[]');
      console.log(`Found ${existingReviews.length} existing reviews.`);
    }
    
    console.log(`Found ${users.length} users and ${contributions.length} contributions.`);
    console.log('Will add reviews by the first 20 users...');
    
    // Get first 20 users (or all if less than 20)
    const targetUsers = users.slice(0, 20);
    const allReviews = [...existingReviews];
    
    // Each user will review 2-4 contributions (not their own)
    for (const user of targetUsers) {
      // Determine how many reviews this user will do
      const reviewCount = Math.floor(Math.random() * 3) + 2; // 2-4 reviews
      console.log(`\nUser ${user.displayName} (FID: ${user.fid}) will submit ${reviewCount} reviews`);
      
      // Find contributions this user can review (not their own)
      const availableContributions = contributions.filter(c => 
        c.authorFid !== user.fid && 
        // Check if user hasn't already reviewed this contribution
        !allReviews.some(r => r.contributionId === c.id && r.reviewerFid === user.fid)
      );
      
      if (availableContributions.length === 0) {
        console.log(`No available contributions for ${user.displayName} to review`);
        continue;
      }
      
      // Select random contributions to review
      const contributionsToReview = [];
      const tempAvailable = [...availableContributions];
      
      for (let i = 0; i < Math.min(reviewCount, tempAvailable.length); i++) {
        const randomIndex = Math.floor(Math.random() * tempAvailable.length);
        contributionsToReview.push(tempAvailable[randomIndex]);
        tempAvailable.splice(randomIndex, 1);
      }
      
      // Create reviews for each selected contribution
      for (const contribution of contributionsToReview) {
        const rating = generateRating();
        const content = generateReviewContent(contribution);
        
        const review = {
          id: uuidv4(),
          contributionId: contribution.id,
          reviewerFid: user.fid,
          reviewerName: user.displayName,
          content,
          rating,
          timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in the past week
          votes: []
        };
        
        // Add review to our collection
        allReviews.push(review);
        
        // Update the contribution with the review ID
        if (!contribution.peerReviews) {
          contribution.peerReviews = [];
        }
        contribution.peerReviews.push(review.id);
        
        // If this is the third review or more, update status to peer_reviewed
        if (contribution.peerReviews.length >= 3) {
          contribution.status = 'peer_reviewed';
          
          // Calculate average rating
          const contributionReviews = allReviews.filter(r => r.contributionId === contribution.id);
          const avgRating = contributionReviews.reduce((sum, r) => sum + r.rating, 0) / contributionReviews.length;
          
          // If average rating is good (≥ 4), verify the contribution
          if (avgRating >= 4) {
            // Generate a mock verification hash
            const verificationHash = `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
            contribution.verificationProof = verificationHash;
            contribution.status = 'verified';
          }
        }
        
        console.log(`Added review for "${contribution.title.substring(0, 40)}..." by ${user.displayName} with rating ${rating}/5`);
      }
      
      // Simulating a delay between users
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update the contributions file with new statuses and peer review IDs
    fs.writeFileSync(CONTRIBUTIONS_PATH, JSON.stringify(contributions, null, 2));
    console.log(`Updated ${contributions.length} contributions with review references`);
    
    // Save all reviews
    fs.writeFileSync(REVIEWS_PATH, JSON.stringify(allReviews, null, 2));
    console.log(`Saved ${allReviews.length} reviews`);
    
  } catch (error) {
    console.error('Error in addResearchReviews:', error);
  }
}

// Run the main function
addResearchReviews()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Fatal error:', err)); 
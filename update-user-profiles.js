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

// Calculate reputation score and token balance based on user activity
function calculateUserMetrics(user, contributions, reviews) {
  // Initialize metrics
  let reputationScore = 0;
  let tokenBalance = 100; // Start with 100 base tokens
  
  // Contributions by user
  const userContributions = contributions.filter(c => c.authorFid === user.fid);
  
  // Reviews by user
  const userReviews = reviews.filter(r => r.reviewerFid === user.fid);
  
  // Reviews received by user
  const reviewsReceived = reviews.filter(r => 
    userContributions.some(c => c.id === r.contributionId)
  );
  
  // 1. Reputation from contributions
  // Base reputation: 20 per contribution
  reputationScore += userContributions.length * 20;
  
  // Additional reputation based on contribution status
  for (const contribution of userContributions) {
    // Peer-reviewed contributions are worth more
    if (contribution.status === 'peer_reviewed') {
      reputationScore += 15;
      tokenBalance += 30;
    }
    
    // Verified contributions are worth even more
    if (contribution.status === 'verified') {
      reputationScore += 30;
      tokenBalance += 70;
    }
    
    // Token reward for each contribution
    tokenBalance += 50;
    
    // Extra reputation if the contribution has collaborators
    if (contribution.collaborators && contribution.collaborators.length > 0) {
      reputationScore += 5 * contribution.collaborators.length;
    }
  }
  
  // 2. Reputation from reviews written
  // Base reputation: 10 per review
  reputationScore += userReviews.length * 10;
  tokenBalance += userReviews.length * 15;
  
  // Additional reputation based on votes received on reviews
  for (const review of userReviews) {
    const upvotes = review.votes.filter(v => v.value === 1).length;
    const downvotes = review.votes.filter(v => v.value === -1).length;
    
    // +2 reputation per upvote, -1 per downvote
    reputationScore += (upvotes * 2) - downvotes;
    
    // +2 tokens per upvote
    tokenBalance += upvotes * 2;
  }
  
  // 3. Reputation from reviews received
  // High-rated contributions increase reputation
  const averageRating = reviewsReceived.length > 0 
    ? reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewsReceived.length
    : 0;
  
  if (reviewsReceived.length > 0) {
    // Bonus reputation based on average rating (scale of 1-5)
    // 1 star: no bonus, 5 stars: +25 reputation
    reputationScore += Math.round((averageRating - 1) * 6.25 * reviewsReceived.length);
  }
  
  // 4. Reputation from collaborations
  // Find contributions where this user is a collaborator
  const collaborations = contributions.filter(c => 
    c.collaborators && c.collaborators.some(collab => collab.fid === user.fid)
  );
  
  // +10 reputation per collaboration
  reputationScore += collaborations.length * 10;
  tokenBalance += collaborations.length * 20;
  
  // 5. Activity reputation - based on total activity
  const totalActivity = userContributions.length + userReviews.length + 
    reviews.filter(r => r.votes.some(v => v.userId === user.fid)).length;
  
  // +5 reputation per activity (diminishing returns)
  reputationScore += Math.min(50, totalActivity * 5);
  
  // Return the calculated metrics
  return {
    reputationScore: Math.round(reputationScore),
    tokenBalance: Math.round(tokenBalance)
  };
}

// Add profile editing fields to users
function addProfileFields(user) {
  // Base fields if not present
  if (!user.profile) {
    user.profile = {
      bio: user.bio || `Researcher in ${getUserSpecialty(user)}`,
      specialty: getUserSpecialty(user),
      institution: getUserInstitution(user),
      degrees: generateUserDegrees(),
      socialLinks: {
        website: '',
        twitter: '',
        linkedIn: '',
        orcid: generateOrcidId()
      },
      researchInterests: generateResearchInterests(),
      canEdit: true
    };
  }
  
  return user;
}

// Helper function to extract specialty from bio
function getUserSpecialty(user) {
  if (user.bio && user.bio.includes('specializing in')) {
    const specialty = user.bio.split('specializing in ')[1].split('.')[0];
    return specialty.trim();
  }
  return getRandomSpecialty();
}

// Helper function to extract institution from email
function getUserInstitution(user) {
  if (user.email) {
    const domain = user.email.split('@')[1];
    
    // Map common domains to institutions
    const institutionMap = {
      'stanford.edu': 'Stanford University',
      'harvard.edu': 'Harvard University',
      'mit.edu': 'Massachusetts Institute of Technology',
      'berkeley.edu': 'University of California, Berkeley',
      'cornell.edu': 'Cornell University',
      'mayoclinic.org': 'Mayo Clinic',
      'clevelandclinic.org': 'Cleveland Clinic',
      'mountsinai.org': 'Mount Sinai Hospital',
      'johnsHopkins.edu': 'Johns Hopkins University',
      'uchicago.edu': 'University of Chicago'
    };
    
    for (const [domainPart, institution] of Object.entries(institutionMap)) {
      if (domain.includes(domainPart.toLowerCase())) {
        return institution;
      }
    }
    
    // If no match in map, use domain as institution
    const institutionParts = domain.split('.');
    if (institutionParts.length >= 2) {
      return institutionParts[0].charAt(0).toUpperCase() + institutionParts[0].slice(1);
    }
  }
  
  return getRandomInstitution();
}

// Generate random specialties
function getRandomSpecialty() {
  const specialties = [
    'Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Psychiatry', 
    'Radiology', 'Surgery', 'Internal Medicine', 'Emergency Medicine', 'Dermatology',
    'Endocrinology', 'Gastroenterology', 'Geriatrics', 'Hematology', 'Immunology'
  ];
  
  return specialties[Math.floor(Math.random() * specialties.length)];
}

// Generate random institutions
function getRandomInstitution() {
  const institutions = [
    'Stanford University', 'Harvard Medical School', 'Mayo Clinic',
    'Johns Hopkins University', 'UCLA Medical Center', 'Cleveland Clinic',
    'Massachusetts General Hospital', 'UCSF Medical Center', 'Northwestern Medicine',
    'NewYork-Presbyterian Hospital', 'University of Michigan Health System'
  ];
  
  return institutions[Math.floor(Math.random() * institutions.length)];
}

// Generate random degrees
function generateUserDegrees() {
  const degrees = [
    { degree: 'M.D.', institution: getRandomInstitution(), year: 2000 + Math.floor(Math.random() * 20) },
    { degree: 'Ph.D.', institution: getRandomInstitution(), year: 1995 + Math.floor(Math.random() * 20) }
  ];
  
  // Randomly return either 1 or 2 degrees
  return Math.random() > 0.5 ? degrees : [degrees[0]];
}

// Generate random ORCID ID
function generateOrcidId() {
  return `0000-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Generate random research interests
function generateResearchInterests() {
  const allInterests = [
    'gene therapy', 'immunotherapy', 'AI in medical diagnostics', 'telemedicine', 'drug delivery systems',
    'precision medicine', 'regenerative medicine', 'bioinformatics', 'mental health interventions', 
    'chronic disease management', 'cancer research', 'neurodegenerative diseases', 'infectious diseases', 
    'vaccines', 'public health initiatives', 'medical devices', 'clinical trials methodology', 
    'healthcare equity', 'patient outcomes research', 'preventive medicine'
  ];
  
  // Select 3-5 random interests
  const interestCount = Math.floor(Math.random() * 3) + 3;
  const interests = [];
  
  while (interests.length < interestCount && allInterests.length > 0) {
    const index = Math.floor(Math.random() * allInterests.length);
    interests.push(allInterests[index]);
    allInterests.splice(index, 1);
  }
  
  return interests;
}

// Main function to update user profiles
async function updateUserProfiles() {
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
    
    // Read existing reviews
    if (!fs.existsSync(REVIEWS_PATH)) {
      console.error('Reviews file not found!');
      return;
    }
    
    const reviewsData = fs.readFileSync(REVIEWS_PATH, 'utf8');
    const reviews = JSON.parse(reviewsData || '[]');
    
    console.log(`Found ${users.length} users, ${contributions.length} contributions, and ${reviews.length} reviews.`);
    console.log('Updating user profiles with reputation scores and token balances...');
    
    // Process each user
    for (const user of users) {
      // Calculate metrics for this user
      const metrics = calculateUserMetrics(user, contributions, reviews);
      
      // Update user with metrics
      user.reputationScore = metrics.reputationScore;
      user.tokenBalance = metrics.tokenBalance;
      
      // Add profile editing fields
      addProfileFields(user);
      
      console.log(`Updated ${user.displayName} (FID: ${user.fid}) - Reputation: ${user.reputationScore}, Tokens: ${user.tokenBalance}`);
    }
    
    // Save updated users data
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2));
    console.log(`Successfully updated ${users.length} user profiles.`);
    
  } catch (error) {
    console.error('Error in updateUserProfiles:', error);
  }
}

// Run the main function
updateUserProfiles()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Fatal error:', err)); 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to user database file
const USER_DB_PATH = path.join(__dirname, 'data', 'email-users.json');

// List of possible profile edits
const profileEdits = [
  {
    name: 'Update Bio',
    apply: (user) => {
      const bios = [
        `${user.profile?.specialty || 'Medical'} researcher with ${Math.floor(Math.random() * 20) + 5} years of experience. Focused on innovative approaches to patient care and treatment outcomes.`,
        `Dedicated ${user.profile?.specialty || 'healthcare'} professional committed to advancing medical knowledge through rigorous research and collaboration.`,
        `Investigating novel treatments in ${user.profile?.specialty || 'medicine'} with particular interest in translational research and clinical applications.`,
        `Passionate about improving patient outcomes through evidence-based approaches in ${user.profile?.specialty || 'medical'} research.`,
        `${user.profile?.specialty || 'Medical'} scientist working at the intersection of clinical practice and cutting-edge research.`
      ];
      
      user.bio = bios[Math.floor(Math.random() * bios.length)];
      user.profile.bio = user.bio;
      return `Updated bio to: "${user.bio}"`;
    }
  },
  {
    name: 'Update Specialty',
    apply: (user) => {
      const specialties = [
        'Precision Medicine', 'Genomics', 'Clinical Trials', 'Biostatistics',
        'Medical Informatics', 'Translational Research', 'Molecular Diagnostics',
        'Health Outcomes Research', 'Comparative Effectiveness', 'Medical Ethics'
      ];
      
      const newSpecialty = specialties[Math.floor(Math.random() * specialties.length)];
      user.profile.specialty = newSpecialty;
      return `Updated specialty to: "${newSpecialty}"`;
    }
  },
  {
    name: 'Update Institution',
    apply: (user) => {
      const institutions = [
        'Stanford Medicine', 'Harvard Medical School', 'Johns Hopkins Medicine',
        'Mayo Clinic Research', 'NIH Clinical Center', 'Memorial Sloan Kettering',
        'Cleveland Clinic Research', 'UCSF Health', 'Duke Health', 
        'Mass General Research Institute'
      ];
      
      const newInstitution = institutions[Math.floor(Math.random() * institutions.length)];
      user.profile.institution = newInstitution;
      return `Updated institution to: "${newInstitution}"`;
    }
  },
  {
    name: 'Add/Update Degree',
    apply: (user) => {
      const degrees = [
        { degree: 'M.D.', institution: 'Harvard Medical School', year: 2005 + Math.floor(Math.random() * 15) },
        { degree: 'Ph.D.', institution: 'Stanford University', year: 2000 + Math.floor(Math.random() * 20) },
        { degree: 'MPH', institution: 'Johns Hopkins Bloomberg School of Public Health', year: 2008 + Math.floor(Math.random() * 12) },
        { degree: 'M.S.', institution: 'MIT', year: 2003 + Math.floor(Math.random() * 17) },
        { degree: 'MBA', institution: 'Wharton School', year: 2010 + Math.floor(Math.random() * 10) }
      ];
      
      const newDegree = degrees[Math.floor(Math.random() * degrees.length)];
      
      // Either replace a degree or add a new one
      if (user.profile.degrees && user.profile.degrees.length > 0 && Math.random() > 0.5) {
        // Replace a random degree
        const randomIndex = Math.floor(Math.random() * user.profile.degrees.length);
        user.profile.degrees[randomIndex] = newDegree;
        return `Updated degree to: ${newDegree.degree} from ${newDegree.institution} (${newDegree.year})`;
      } else {
        // Add a new degree
        if (!user.profile.degrees) {
          user.profile.degrees = [];
        }
        user.profile.degrees.push(newDegree);
        return `Added new degree: ${newDegree.degree} from ${newDegree.institution} (${newDegree.year})`;
      }
    }
  },
  {
    name: 'Update Social Links',
    apply: (user) => {
      const twitterHandles = ['@DrResearch', '@MedScientist', '@HealthInnovator', '@ScienceMD', '@ClinicalProf'];
      const websites = [
        'https://www.researchgate.net/profile/researcher',
        'https://scholar.google.com/citations',
        'https://www.academia.edu/profile',
        'https://orcid.org/profile',
        'https://www.linkedin.com/in/medical-researcher'
      ];
      
      const randomTwitter = twitterHandles[Math.floor(Math.random() * twitterHandles.length)];
      const randomWebsite = websites[Math.floor(Math.random() * websites.length)];
      
      user.profile.socialLinks = user.profile.socialLinks || {};
      user.profile.socialLinks.twitter = randomTwitter;
      user.profile.socialLinks.website = randomWebsite;
      
      return `Updated social links - Twitter: ${randomTwitter}, Website: ${randomWebsite}`;
    }
  },
  {
    name: 'Update Research Interests',
    apply: (user) => {
      const interestOptions = [
        'precision oncology', 'immune checkpoint inhibitors', 'CRISPR gene editing',
        'machine learning diagnostics', 'patient-reported outcomes', 'drug repurposing',
        'real-world evidence', 'digital biomarkers', 'clinical decision support systems',
        'health equity research', 'personalized medicine', 'rare disease therapeutics',
        'predictive analytics', 'medical device innovation', 'comparative effectiveness research'
      ];
      
      // Select 3-5 random interests
      const interestCount = Math.floor(Math.random() * 3) + 3;
      const newInterests = [];
      const tempInterests = [...interestOptions];
      
      for (let i = 0; i < interestCount; i++) {
        if (tempInterests.length === 0) break;
        const index = Math.floor(Math.random() * tempInterests.length);
        newInterests.push(tempInterests[index]);
        tempInterests.splice(index, 1);
      }
      
      user.profile.researchInterests = newInterests;
      return `Updated research interests to: ${newInterests.join(', ')}`;
    }
  }
];

// Simulate a user editing their profile
function simulateProfileEdit(user) {
  console.log(`\n==== ${user.displayName} (FID: ${user.fid}) is editing their profile ====`);
  
  // How many edits will this user make (1-3)
  const numEdits = Math.floor(Math.random() * 3) + 1;
  console.log(`Making ${numEdits} profile edits...`);
  
  // Make random edits
  const availableEdits = [...profileEdits];
  
  for (let i = 0; i < numEdits; i++) {
    if (availableEdits.length === 0) break;
    
    // Select a random edit type
    const editIndex = Math.floor(Math.random() * availableEdits.length);
    const editType = availableEdits[editIndex];
    
    // Apply the edit
    console.log(`Edit ${i+1}: ${editType.name}`);
    const result = editType.apply(user);
    console.log(`  ${result}`);
    
    // Remove this edit type from available edits to avoid duplicate edits
    availableEdits.splice(editIndex, 1);
  }
  
  console.log(`==== ${user.displayName} profile update complete ====\n`);
  return user;
}

// Main function to simulate profile edits
async function simulateProfileEdits() {
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
    
    console.log(`Found ${users.length} users in database.`);
    console.log('Simulating profile edits for 8 random users...');
    
    // Select 8 random users to edit their profiles
    const userIndices = new Set();
    while (userIndices.size < 8 && userIndices.size < users.length) {
      const randomIndex = Math.floor(Math.random() * users.length);
      userIndices.add(randomIndex);
    }
    
    // Simulate edits for selected users
    for (const index of userIndices) {
      const user = users[index];
      
      // Make sure user has a profile object
      if (!user.profile) {
        user.profile = {
          bio: user.bio || '',
          specialty: '',
          institution: '',
          degrees: [],
          socialLinks: {},
          researchInterests: [],
          canEdit: true
        };
      }
      
      // Simulate profile edits
      simulateProfileEdit(user);
      
      // Update the user in the array
      users[index] = user;
      
      // Small delay between users
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Save the updated users
    fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2));
    console.log(`Successfully simulated profile edits for ${userIndices.size} users.`);
    
  } catch (error) {
    console.error('Error in simulateProfileEdits:', error);
  }
}

// Run the main function
simulateProfileEdits()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Fatal error:', err)); 
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

// Hubble node URL
const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';

// Function to generate random research interests for the tags
function generateTags() {
  const researchTags = [
    'gene therapy', 'immunotherapy', 'AI diagnostics', 'telemedicine', 'drug delivery',
    'precision medicine', 'regenerative medicine', 'bioinformatics', 'mental health', 'chronic disease',
    'cancer research', 'neurodegenerative diseases', 'infectious diseases', 'vaccines', 'public health',
    'medical devices', 'clinical trials', 'healthcare equity', 'patient outcomes', 'preventive medicine'
  ];
  
  // Select 2-4 random tags
  const numTags = Math.floor(Math.random() * 3) + 2;
  const selectedTags = [];
  
  for (let i = 0; i < numTags; i++) {
    const randomIndex = Math.floor(Math.random() * researchTags.length);
    const tag = researchTags[randomIndex];
    
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
    }
    
    // Remove the selected tag to avoid duplicates
    researchTags.splice(randomIndex, 1);
  }
  
  return selectedTags;
}

// Function to generate realistic research titles
function generateResearchTitle() {
  const prefixes = [
    'Novel', 'Innovative', 'Advanced', 'Comprehensive', 'Emerging',
    'Integrative', 'Systematic', 'Comparative', 'Longitudinal', 'Translational'
  ];
  
  const topics = [
    'Application of Machine Learning', 'Genetic Analysis', 'Treatment Approach',
    'Therapeutic Strategy', 'Clinical Outcomes', 'Patient Care Model',
    'Diagnostic Method', 'Intervention Protocol', 'Drug Delivery System',
    'Biomarker Identification', 'Cellular Mechanism', 'Disease Progression'
  ];
  
  const contexts = [
    'in Chronic Disease Management', 'for Rare Genetic Disorders',
    'in Cancer Treatment', 'for Neurological Disorders',
    'in Cardiovascular Diseases', 'for Autoimmune Conditions',
    'in Pediatric Care', 'for Geriatric Patients',
    'in Mental Health Treatment', 'for Infectious Disease Control',
    'in Public Health Interventions', 'for Preventive Medicine'
  ];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const context = contexts[Math.floor(Math.random() * contexts.length)];
  
  return `${prefix} ${topic} ${context}`;
}

// Function to generate research abstract
function generateAbstract(title) {
  const introductions = [
    'This study investigates', 'We present a novel approach to',
    'Recent advances have enabled', 'This research explores',
    'We report findings from', 'This paper introduces'
  ];
  
  const methods = [
    'Using a multi-center clinical trial,', 'Through retrospective analysis of patient data,',
    'Employing advanced machine learning techniques,', 'Through a systematic literature review,',
    'Using a mixed-methods research approach,', 'Through a series of controlled experiments,'
  ];
  
  const results = [
    'our results demonstrate significant improvements', 'we observed a statistically significant correlation',
    'the findings suggest a promising new direction', 'our analysis revealed important patterns',
    'the data indicates substantial benefits', 'we found compelling evidence'
  ];
  
  const implications = [
    'These findings have important implications for clinical practice.',
    'This work contributes to our understanding of disease mechanisms.',
    'The results may lead to improved patient outcomes and quality of life.',
    'This research opens new avenues for therapeutic intervention.',
    'Our study provides a foundation for future research in this area.',
    'These insights could transform current treatment protocols.'
  ];
  
  const intro = introductions[Math.floor(Math.random() * introductions.length)];
  const method = methods[Math.floor(Math.random() * methods.length)];
  const result = results[Math.floor(Math.random() * results.length)];
  const implication = implications[Math.floor(Math.random() * implications.length)];
  
  return `${intro} ${title.toLowerCase()}. ${method} ${result}. ${implication}`;
}

// Function to generate research content (more detailed than abstract)
function generateContent(title, abstract) {
  const introduction = `# Introduction\nThe field of medical research continually evolves with new technologies and methodologies. ${abstract}\n\n`;
  
  const background = `# Background\nPrevious studies have shown mixed results in this domain, with several limitations in methodological approaches and sample sizes. Our work builds upon this foundation while addressing key gaps in the existing literature.\n\n`;
  
  const methods = `# Methods\nWe conducted a comprehensive study using a combination of quantitative and qualitative approaches. Data collection occurred over an 18-month period, involving multiple research sites and a diverse patient population. Statistical analysis was performed using state-of-the-art techniques to ensure robust findings.\n\n`;
  
  const results = `# Results\nThe analysis revealed several key findings that support our initial hypothesis. We observed statistically significant improvements in primary outcome measures (p<0.01), with effect sizes ranging from moderate to large. Secondary analyses further confirmed these results across different subgroups and conditions.\n\n`;
  
  const discussion = `# Discussion\nThese findings represent an important advancement in our understanding of the subject matter. The results have several implications for both clinical practice and future research directions. We acknowledge certain limitations in our approach, including potential selection bias and the need for longer-term follow-up studies.\n\n`;
  
  const conclusion = `# Conclusion\nIn conclusion, our research demonstrates promising results that could significantly impact patient care and treatment outcomes. Future work should focus on validating these findings in larger populations and exploring additional applications in related medical fields.`;
  
  return introduction + background + methods + results + discussion + conclusion;
}

// Function to generate research links
function generateLinks() {
  const linkTypes = ['paper', 'dataset', 'code', 'external'];
  const numLinks = Math.floor(Math.random() * 3) + 1; // 1-3 links
  const links = [];
  
  for (let i = 0; i < numLinks; i++) {
    const linkType = linkTypes[Math.floor(Math.random() * linkTypes.length)];
    let url, description;
    
    switch (linkType) {
      case 'paper':
        url = `https://doi.org/10.1234/med.${Math.floor(Math.random() * 10000)}`;
        description = 'Published paper in medical journal';
        break;
      case 'dataset':
        url = `https://data.med.research/dataset-${Math.floor(Math.random() * 1000)}`;
        description = 'Anonymous patient data used in the study';
        break;
      case 'code':
        url = `https://github.com/researcher/medical-analysis-${Math.floor(Math.random() * 100)}`;
        description = 'Analysis code and utilities';
        break;
      case 'external':
        url = `https://www.medicalresearch.org/publications/${Math.floor(Math.random() * 10000)}`;
        description = 'Additional resources and related work';
        break;
    }
    
    links.push({
      type: linkType,
      url,
      description
    });
  }
  
  return links;
}

// Function to generate collaborators
function generateCollaborators(users, authorFid) {
  const numCollaborators = Math.floor(Math.random() * 3); // 0-2 collaborators
  if (numCollaborators === 0) return undefined;
  
  const collaborators = [];
  const availableUsers = users.filter(user => user.fid !== authorFid);
  
  const roles = [
    'Data Analysis', 'Clinical Oversight', 'Methodology Design', 
    'Statistical Review', 'Literature Research', 'Technical Support'
  ];
  
  for (let i = 0; i < numCollaborators && i < availableUsers.length; i++) {
    const randomIndex = Math.floor(Math.random() * availableUsers.length);
    const user = availableUsers[randomIndex];
    
    collaborators.push({
      fid: user.fid,
      name: user.displayName,
      role: roles[Math.floor(Math.random() * roles.length)]
    });
    
    // Remove user from available users to avoid duplicates
    availableUsers.splice(randomIndex, 1);
  }
  
  return collaborators;
}

// Function to create a contribution and submit to Farcaster
async function createAndSubmitContribution(user, users) {
  // Generate research data
  const title = generateResearchTitle();
  const abstract = generateAbstract(title);
  const content = generateContent(title, abstract);
  const tags = generateTags();
  const links = generateLinks();
  const collaborators = generateCollaborators(users, user.fid);
  const timestamp = Date.now();
  
  // Create contribution object
  const contribution = {
    id: uuidv4(),
    title,
    abstract,
    content,
    authorFid: user.fid,
    authorName: user.displayName,
    timestamp,
    tags,
    links,
    status: 'published',
    reviewStatus: 'pending',
    collaborators
  };
  
  // Log the contribution being created
  console.log(`Creating contribution for ${user.displayName} (FID: ${user.fid}): ${title}`);
  
  try {
    // Try to submit to Farcaster directly
    console.log(`Submitting to Farcaster for user ${user.fid}...`);
    
    // Submit the contribution to Farcaster
    const response = await fetch(`${HUBBLE_HTTP_URL}/v1/submitMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'MESSAGE_TYPE_CAST_ADD',
        fid: user.fid,
        castAddBody: {
          text: `Research: ${title}\n\n${abstract.substring(0, 240)}${abstract.length > 240 ? '...' : ''}\n\nTags: ${tags.join(', ')}`,
          mentions: [],
          mentionsPositions: [],
          embeds: []
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`Success! Farcaster hash: ${result.hash}`);
      
      // Update the contribution with the hash
      if (result.hash) {
        contribution.farcasterHash = result.hash;
      }
    } else {
      console.log(`Failed to submit to Farcaster: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Error submitting to Farcaster: ${error.message}`);
  }
  
  return contribution;
}

// Main function to add research contributions for the first 20 users
async function addResearchContributions() {
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
    
    console.log(`Found ${users.length} users, will process first 20 users...`);
    
    // Get first 20 users (or all if less than 20)
    const targetUsers = users.slice(0, 20);
    
    // Read existing contributions if the file exists
    let contributions = [];
    if (fs.existsSync(CONTRIBUTIONS_PATH)) {
      const contributionsData = fs.readFileSync(CONTRIBUTIONS_PATH, 'utf8');
      contributions = JSON.parse(contributionsData || '[]');
      console.log(`Found ${contributions.length} existing contributions.`);
    }
    
    // Process each user
    for (const user of targetUsers) {
      console.log(`Processing user: ${user.displayName} (${user.fid})`);
      
      // Create and submit a new contribution
      const newContribution = await createAndSubmitContribution(user, users);
      
      // Add to contributions array
      contributions.push(newContribution);
      
      // Wait a bit to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save all contributions to file
    fs.writeFileSync(CONTRIBUTIONS_PATH, JSON.stringify(contributions, null, 2));
    console.log(`Successfully processed ${targetUsers.length} users and saved ${contributions.length} contributions.`);
    
  } catch (error) {
    console.error('Error in addResearchContributions:', error);
  }
}

// Run the main function
addResearchContributions()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Fatal error:', err)); 
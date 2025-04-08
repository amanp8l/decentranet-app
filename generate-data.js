import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to data files
const USER_DB_PATH = path.join(__dirname, 'data', 'email-users.json');
const CASTS_PATH = path.join(__dirname, 'data', 'casts.json');
const COMMENTS_PATH = path.join(__dirname, 'data', 'comments.json');
const VOTES_PATH = path.join(__dirname, 'data', 'votes.json');
const FORUM_TOPICS_PATH = path.join(__dirname, 'data', 'forum-topics.json');
const FORUM_REPLIES_PATH = path.join(__dirname, 'data', 'forum-replies.json');

// Function to generate a random UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Function to generate random date within the past 6 months
function generatePastDate() {
  const now = new Date();
  const pastMonth = new Date();
  pastMonth.setMonth(now.getMonth() - 6);
  
  const diff = now.getTime() - pastMonth.getTime();
  const randomTime = Math.floor(Math.random() * diff);
  
  return new Date(pastMonth.getTime() + randomTime);
}

// Function to generate future date (for demo data)
function generateFutureDate() {
  const now = new Date();
  const futureYear = new Date();
  futureYear.setFullYear(2025);
  
  const diff = futureYear.getTime() - now.getTime();
  const randomTime = Math.floor(Math.random() * diff);
  
  return new Date(now.getTime() + randomTime);
}

// Generate random FID
function generateFID() {
  return Math.floor(Math.random() * 9000000000) + 1000000000;
}

// Generate random password hash and salt
function generatePasswordCredentials() {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha512')
    .update('password123' + salt)
    .digest('hex');
  
  return { passwordHash: hash, passwordSalt: salt };
}

// Realistic domains for professional emails
const emailDomains = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'hotmail.com',
  'stanford.edu', 'harvard.edu', 'mit.edu', 'cornell.edu', 'berkeley.edu',
  'mayoclinic.org', 'clevelandclinic.org', 'mountsinai.org', 'johnsHopkins.edu', 'uchicago.edu'
];

// Medical specialties for bios
const specialties = [
  'Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Psychiatry', 
  'Radiology', 'Surgery', 'Internal Medicine', 'Emergency Medicine', 'Dermatology',
  'Endocrinology', 'Gastroenterology', 'Geriatrics', 'Hematology', 'Immunology',
  'Infectious Disease', 'Nephrology', 'Pulmonology', 'Rheumatology', 'Urology'
];

// Research interests
const researchInterests = [
  'gene therapy', 'immunotherapy', 'AI in medical diagnostics', 'telemedicine', 'drug delivery systems',
  'precision medicine', 'regenerative medicine', 'bioinformatics', 'mental health', 'chronic disease management',
  'cancer research', 'neurodegenerative diseases', 'infectious diseases', 'vaccines', 'public health',
  'medical devices', 'clinical trials', 'healthcare equity', 'patient outcomes', 'preventive medicine'
];

// Common medical topics for casts and forum discussions
const medicalTopics = [
  'Recent advances in', 'Challenges in', 'Best practices for', 'A case study on', 'New research about',
  'Guidelines for', 'Controversial approaches to', 'My experience with', 'Innovative treatments for', 'Understanding',
  'The future of', 'Ethical considerations in', 'Patient perspectives on', 'Global trends in', 'Technology impact on'
];

// Generate realistic user data
function generateUsers(count = 20) {
  const users = [];
  const titles = ['Dr.', 'Prof.', 'Dr.', 'Dr.', 'Prof.'];

  for (let i = 0; i < count; i++) {
    // Generate random first and last name
    const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 
                       'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
                       'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth',
                       'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle'];
    
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
                      'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    
    // Generate username and email
    const username = (firstName + lastName + Math.floor(Math.random() * 100)).toLowerCase();
    const emailDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}`;
    
    // Generate FID
    const fid = generateFID();
    
    // Generate specialty and bio
    const specialty = specialties[Math.floor(Math.random() * specialties.length)];
    const interest = researchInterests[Math.floor(Math.random() * researchInterests.length)];
    const bio = `${title} ${firstName} ${lastName}, specializing in ${specialty}. Research interests include ${interest}.`;
    
    // Generate random stats
    const postCount = Math.floor(Math.random() * 15);
    const commentCount = Math.floor(Math.random() * 30);
    const receivedUpvotes = Math.floor(Math.random() * 50);
    const receivedDownvotes = Math.floor(Math.random() * 10);
    const givenUpvotes = Math.floor(Math.random() * 40);
    const givenDownvotes = Math.floor(Math.random() * 15);
    
    // Generate password credentials
    const credentials = generatePasswordCredentials();
    
    // Generate followers and following
    const followers = [];
    const following = [];
    
    // Will fill these arrays after creating all users
    
    // Create user object
    const user = {
      id: generateUUID(),
      email,
      passwordHash: credentials.passwordHash,
      passwordSalt: credentials.passwordSalt,
      username,
      displayName: `${title} ${firstName} ${lastName}`,
      fid,
      provider: 'email',
      pfp: null,
      bio,
      followers,
      following,
      verifications: [],
      authToken: generateUUID(),
      createdAt: generateFutureDate().toISOString(),
      stats: {
        postCount,
        commentCount,
        receivedUpvotes,
        receivedDownvotes,
        givenUpvotes,
        givenDownvotes
      }
    };
    
    users.push(user);
  }
  
  // Now assign followers and following between users
  for (const user of users) {
    // Each user follows 3-10 random other users
    const followingCount = Math.floor(Math.random() * 8) + 3;
    const otherUsers = users.filter(u => u.fid !== user.fid);
    
    for (let i = 0; i < followingCount; i++) {
      if (otherUsers.length === 0) break;
      
      // Pick a random user that this user is not already following
      const availableToFollow = otherUsers.filter(u => !user.following.includes(u.fid));
      if (availableToFollow.length === 0) break;
      
      const randomIndex = Math.floor(Math.random() * availableToFollow.length);
      const userToFollow = availableToFollow[randomIndex];
      
      // Add to following
      user.following.push(userToFollow.fid);
      
      // Add to the target user's followers
      const targetUser = users.find(u => u.fid === userToFollow.fid);
      if (targetUser && !targetUser.followers.includes(user.fid)) {
        targetUser.followers.push(user.fid);
      }
      
      // Remove this user from options to avoid duplicates
      otherUsers.splice(otherUsers.indexOf(userToFollow), 1);
    }
  }
  
  return users;
}

// Generate casts for users
function generateCasts(users) {
  const casts = [];
  
  // Random content generators
  const generateCastText = () => {
    const topic = medicalTopics[Math.floor(Math.random() * medicalTopics.length)];
    const disease = specialties[Math.floor(Math.random() * specialties.length)].toLowerCase();
    const research = researchInterests[Math.floor(Math.random() * researchInterests.length)];
    
    const templates = [
      `${topic} ${disease} treatment options.`,
      `Just published a paper on ${research}. Exciting results!`,
      `Attended a conference on ${disease}. Great insights from colleagues.`,
      `Thoughts on the latest guidelines for ${disease} management?`,
      `Interesting case today involving ${disease}. Any similar experiences?`,
      `New study suggests promising approach to ${research}.`,
      `What's everyone's opinion on ${topic} ${disease}?`,
      `Seeking collaborators for research on ${research}. DM if interested.`,
      `Just read a fascinating paper about ${research}. Highly recommend!`,
      `Challenging ${disease} case today. Always learning in this field.`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  };
  
  // For each user, generate 0-5 casts
  for (const user of users) {
    const castCount = Math.floor(Math.random() * 6);
    
    for (let i = 0; i < castCount; i++) {
      const castDate = generateFutureDate();
      const hash = '0x' + crypto.randomBytes(6).toString('hex');
      
      const cast = {
        id: generateUUID(),
        hash,
        fid: user.fid,
        username: user.username,
        displayName: user.displayName,
        avatar: user.pfp,
        data: {
          text: generateCastText(),
          timestamp: castDate.getTime(),
          mentions: [],
          mentionsPositions: [],
          embeds: []
        },
        createdAt: castDate.toISOString()
      };
      
      casts.push(cast);
    }
  }
  
  return casts;
}

// Generate comments for casts
function generateComments(users, casts) {
  const comments = {};
  
  // Comment templates
  const commentTemplates = [
    "Interesting perspective. I've seen similar outcomes in my practice.",
    "Great points! Have you considered the implications for long-term patient outcomes?",
    "Thanks for sharing this. Very relevant to my current research.",
    "I'd love to discuss this further. Our team is working on something similar.",
    "Important findings. Do you have the full paper available?",
    "This aligns with my clinical experience as well.",
    "Have you seen the recent meta-analysis on this topic?",
    "What methodology did you use? I'm curious about replicating this.",
    "Compelling argument. We should collaborate on a follow-up study.",
    "This could change our approach to treatment protocols."
  ];
  
  // For some casts, add comments
  for (const cast of casts) {
    // 50% chance of having comments
    if (Math.random() < 0.5) {
      const commentCount = Math.floor(Math.random() * 5) + 1;
      const castComments = [];
      
      for (let i = 0; i < commentCount; i++) {
        // Choose a random user who isn't the cast author
        const commenters = users.filter(u => u.fid !== cast.fid);
        const commenter = commenters[Math.floor(Math.random() * commenters.length)];
        
        // Create the comment
        const commentDate = new Date(cast.data.timestamp + Math.floor(Math.random() * 86400000)); // Within a day
        const commentText = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
        
        const comment = {
          id: generateUUID(),
          text: commentText,
          authorFid: commenter.fid,
          timestamp: commentDate.getTime(),
          votes: []
        };
        
        // Add some votes to comments (30% chance)
        if (Math.random() < 0.3) {
          const voteCount = Math.floor(Math.random() * 3) + 1;
          const voters = users.filter(u => u.fid !== commenter.fid);
          
          for (let j = 0; j < voteCount && j < voters.length; j++) {
            const voter = voters[j];
            const voteValue = Math.random() < 0.8 ? 1 : -1; // 80% chance of upvote
            
            comment.votes.push({
              userId: voter.fid,
              value: voteValue,
              timestamp: commentDate.getTime() + 3600000 // an hour later
            });
          }
        }
        
        // 20% chance of having replies
        if (Math.random() < 0.2) {
          comment.replies = [];
          const replyCount = Math.floor(Math.random() * 2) + 1;
          
          for (let j = 0; j < replyCount; j++) {
            const repliers = users.filter(u => u.fid !== commenter.fid);
            const replier = repliers[Math.floor(Math.random() * repliers.length)];
            
            const replyDate = new Date(commentDate.getTime() + Math.floor(Math.random() * 3600000)); // Within an hour
            const replyText = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
            
            const reply = {
              id: generateUUID(),
              text: replyText,
              authorFid: replier.fid,
              timestamp: replyDate.getTime(),
              parentId: comment.id,
              votes: []
            };
            
            comment.replies.push(reply.id);
            castComments.push(reply);
          }
        }
        
        castComments.push(comment);
      }
      
      comments[cast.id] = castComments;
    }
  }
  
  return comments;
}

// Generate votes for casts
function generateVotes(users, casts) {
  const votes = {};
  
  // For each cast, maybe add some votes
  for (const cast of casts) {
    // 60% chance of having votes
    if (Math.random() < 0.6) {
      const voteCount = Math.floor(Math.random() * 5) + 1;
      const castVotes = [];
      
      // Get potential voters (not the author)
      const voters = users.filter(u => u.fid !== cast.fid);
      
      for (let i = 0; i < voteCount && i < voters.length; i++) {
        const voter = voters[i];
        const voteValue = Math.random() < 0.8 ? 1 : -1; // 80% chance of upvote
        const voteDate = new Date(cast.data.timestamp + Math.floor(Math.random() * 86400000)); // Within a day
        
        castVotes.push({
          userId: voter.fid,
          value: voteValue,
          timestamp: voteDate.getTime()
        });
      }
      
      if (castVotes.length > 0) {
        votes[cast.id] = castVotes;
      }
    }
  }
  
  return votes;
}

// Generate forum topics
function generateForumTopics(users) {
  const topics = [];
  const categories = ['announcements', 'clinical-research', 'medical-cases', 'equipment-technology', 'education-training'];
  const tags = ['cancer', 'cardiology', 'neurology', 'pediatrics', 'surgery', 'research', 'technology', 'case-study', 'ai', 'genetics', 'immunology'];
  
  // Topic title generators
  const generateTopicTitle = () => {
    const topic = medicalTopics[Math.floor(Math.random() * medicalTopics.length)];
    const specialty = specialties[Math.floor(Math.random() * specialties.length)];
    const research = researchInterests[Math.floor(Math.random() * researchInterests.length)];
    
    const templates = [
      `${topic} ${specialty}`,
      `Seeking advice on challenging ${specialty} case`,
      `New research findings in ${research}`,
      `Call for collaboration: ${research} study`,
      `Discussion: Latest treatment approaches for ${specialty.toLowerCase()} patients`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  };
  
  // Topic content generators
  const generateTopicContent = () => {
    const research = researchInterests[Math.floor(Math.random() * researchInterests.length)];
    const specialty = specialties[Math.floor(Math.random() * specialties.length)];
    
    const templates = [
      `I've been researching ${research} and would like to share some preliminary findings. Our team has observed significant improvements in patient outcomes when implementing a new protocol that focuses on early intervention and personalized care plans. Has anyone else been experimenting with similar approaches?`,
    
      `I recently encountered a challenging case involving a patient with atypical presentation of ${specialty.toLowerCase()} symptoms. Despite extensive testing, we're struggling to reach a definitive diagnosis. The patient presents with unusual symptoms but conventional treatments have been ineffective. I'd appreciate any insights or similar case experiences.`,
    
      `Our institution is launching a multi-center study on ${research} and we're looking for collaborators. The study aims to address long-standing questions about efficacy and safety across diverse patient populations. If your facility is interested in participating, please comment or contact me directly.`,
    
      `What tools or technologies is everyone using for ${research}? We're in the process of upgrading our systems and would appreciate recommendations based on real-world clinical experience, especially regarding integration with existing EMR systems and patient data security.`,
    
      `I'd like to discuss the implications of recent guidelines for managing ${specialty.toLowerCase()} conditions. The changes in recommended treatment protocols seem significant, but I'm concerned about implementation challenges, especially in resource-limited settings. How is everyone adapting to these new recommendations?`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  };
  
  // Create 10-15 forum topics
  const topicCount = Math.floor(Math.random() * 6) + 10;
  
  for (let i = 0; i < topicCount; i++) {
    // Choose a random user as author
    const author = users[Math.floor(Math.random() * users.length)];
    
    // Generate topic data
    const title = generateTopicTitle();
    const content = generateTopicContent();
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // Generate 1-3 random tags
    const topicTags = [];
    const tagCount = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < tagCount; j++) {
      const tag = tags[Math.floor(Math.random() * tags.length)];
      if (!topicTags.includes(tag)) {
        topicTags.push(tag);
      }
    }
    
    // Create topic date (between 1-6 months ago)
    const topicDate = generateFutureDate();
    const viewCount = Math.floor(Math.random() * 100) + 20;
    
    // Create the topic object
    const topic = {
      id: `topic-${topicDate.getTime()}-${Math.floor(Math.random() * 10000)}`,
      title,
      content,
      authorFid: author.fid,
      authorName: author.displayName,
      categoryId: category,
      timestamp: topicDate.getTime(),
      replyCount: 0, // Will update after generating replies
      viewCount,
      isPinned: Math.random() < 0.1, // 10% chance of being pinned
      isLocked: Math.random() < 0.05, // 5% chance of being locked
      tags: topicTags
    };
    
    topics.push(topic);
  }
  
  return topics;
}

// Generate forum replies
function generateForumReplies(users, topics) {
  const replies = [];
  
  // Reply content templates
  const replyTemplates = [
    `Thank you for sharing this. In my experience with ${specialties[Math.floor(Math.random() * specialties.length)].toLowerCase()} patients, I've observed similar patterns. Have you considered the impact of comorbidities on these outcomes?`,
    
    `This is fascinating research. Our team has been working on related questions in ${researchInterests[Math.floor(Math.random() * researchInterests.length)]}, and we're seeing complementary results. I'd be interested in discussing potential collaboration opportunities.`,
    
    `I encountered a similar case last year. What helped us reach a diagnosis was a specialized approach to imaging. It might be worth exploring in your patient's case, especially given the atypical presentation you described.`,
    
    `The methodology looks solid, but I'm curious about your approach to patient selection. In our studies, we've found that ${researchInterests[Math.floor(Math.random() * researchInterests.length)]} outcomes can vary significantly based on subtle demographic factors.`,
    
    `We've implemented these guidelines at our institution with some modifications to address the resource constraints you mentioned. Key adaptations included prioritizing high-risk patients, which helped maintain quality while reducing implementation barriers.`,
    
    `Have you reviewed the recent meta-analysis published in the Journal of Medical Research? It offers a comprehensive assessment of the very questions you're raising, particularly regarding long-term efficacy.`,
    
    `This aligns with emerging trends we're observing in our clinic. The shift toward ${researchInterests[Math.floor(Math.random() * researchInterests.length)]} is promising, though challenges remain in standardization and quality control.`,
    
    `I'd caution against generalizing these findings too broadly. Our research suggests significant variability across different patient populations, particularly in response to the treatments you've described.`
  ];
  
  // For each topic, generate replies
  for (const topic of topics) {
    // Skip locked topics sometimes
    if (topic.isLocked && Math.random() < 0.7) continue;
    
    // Generate 0-8 replies per topic
    const replyCount = Math.floor(Math.random() * 9);
    const topicReplies = [];
    
    for (let i = 0; i < replyCount; i++) {
      // Choose a random user as author (not the topic author)
      const potentialRepliers = users.filter(u => u.fid !== topic.authorFid);
      const author = potentialRepliers[Math.floor(Math.random() * potentialRepliers.length)];
      
      // Generate reply date (after topic date)
      const replyDate = new Date(topic.timestamp + Math.floor(Math.random() * 604800000)); // Within a week
      
      // Create the reply object
      const reply = {
        id: `reply-${replyDate.getTime()}-${Math.floor(Math.random() * 10000)}`,
        topicId: topic.id,
        content: replyTemplates[Math.floor(Math.random() * replyTemplates.length)],
        authorFid: author.fid,
        authorName: author.displayName,
        timestamp: replyDate.getTime(),
        isAnswer: Math.random() < 0.1, // 10% chance of being marked as answer
        votes: []
      };
      
      // Add some votes (40% chance)
      if (Math.random() < 0.4) {
        const voteCount = Math.floor(Math.random() * 3) + 1;
        const voters = users.filter(u => u.fid !== author.fid);
        
        for (let j = 0; j < voteCount && j < voters.length; j++) {
          const voter = voters[j];
          const voteValue = Math.random() < 0.8 ? 1 : -1; // 80% chance of upvote
          
          reply.votes.push({
            userId: voter.fid,
            value: voteValue,
            timestamp: replyDate.getTime() + 3600000 // an hour later
          });
        }
      }
      
      topicReplies.push(reply);
    }
    
    // For some replies, add parent-child relationships (nested replies)
    for (let i = 0; i < topicReplies.length; i++) {
      // 30% chance for a reply to be a child of a previous reply
      if (i > 0 && Math.random() < 0.3) {
        const parentIndex = Math.floor(Math.random() * i);
        topicReplies[i].parentId = topicReplies[parentIndex].id;
        
        // Make sure the parent has a replies array
        if (!topicReplies[parentIndex].replies) {
          topicReplies[parentIndex].replies = [];
        }
        
        topicReplies[parentIndex].replies.push(topicReplies[i].id);
      }
    }
    
    // Update the topic's reply count and last reply info
    if (topicReplies.length > 0) {
      topic.replyCount = topicReplies.length;
      
      // Find the latest reply
      const latestReply = topicReplies.reduce((latest, reply) => {
        return reply.timestamp > latest.timestamp ? reply : latest;
      }, topicReplies[0]);
      
      topic.lastReplyTimestamp = latestReply.timestamp;
      topic.lastReplyAuthorFid = latestReply.authorFid;
      topic.lastReplyAuthorName = latestReply.authorName;
    }
    
    replies.push(...topicReplies);
  }
  
  return replies;
}

// Generate all data and save to files
function generateAllData() {
  console.log('Generating realistic user data...');
  
  // Generate 20 users
  const users = generateUsers(20);
  
  // Generate casts
  const casts = generateCasts(users);
  
  // Generate comments
  const comments = generateComments(users, casts);
  
  // Generate votes
  const votes = generateVotes(users, casts);
  
  // Generate forum topics
  const forumTopics = generateForumTopics(users);
  
  // Generate forum replies
  const forumReplies = generateForumReplies(users, forumTopics);
  
  // Save data to files
  fs.writeFileSync(USER_DB_PATH, JSON.stringify(users, null, 2));
  fs.writeFileSync(CASTS_PATH, JSON.stringify(casts, null, 2));
  fs.writeFileSync(COMMENTS_PATH, JSON.stringify(comments, null, 2));
  fs.writeFileSync(VOTES_PATH, JSON.stringify(votes, null, 2));
  fs.writeFileSync(FORUM_TOPICS_PATH, JSON.stringify(forumTopics, null, 2));
  fs.writeFileSync(FORUM_REPLIES_PATH, JSON.stringify(forumReplies, null, 2));
  
  console.log('Data generation complete!');
  console.log(`Generated ${users.length} users`);
  console.log(`Generated ${casts.length} casts`);
  console.log(`Generated comments for ${Object.keys(comments).length} casts`);
  console.log(`Generated votes for ${Object.keys(votes).length} casts`);
  console.log(`Generated ${forumTopics.length} forum topics`);
  console.log(`Generated ${forumReplies.length} forum replies`);
}

// Run the data generation
generateAllData(); 
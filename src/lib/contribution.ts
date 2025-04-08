import { v4 as uuidv4 } from 'uuid';
import { ResearchContribution, ResearchReview, SpecializationField } from '@/types/desci';
import { 
  updateUserReputation, 
  recordTokenTransaction, 
  verifyContribution 
} from './blockchain';

// In-memory storage for development
let contributions: ResearchContribution[] = [];
let reviews: ResearchReview[] = [];
let specializations: SpecializationField[] = [
  { id: 'med-genetics', name: 'Medical Genetics', description: 'Research in genetic factors affecting health and disease' },
  { id: 'oncology', name: 'Oncology', description: 'Cancer research and treatment methods' },
  { id: 'neuroscience', name: 'Neuroscience', description: 'Study of the nervous system and brain' },
  { id: 'cardiology', name: 'Cardiology', description: 'Heart and cardiovascular system research' },
  { id: 'immunology', name: 'Immunology', description: 'Study of immune systems and responses' },
  { id: 'biotech', name: 'Biotechnology', description: 'Technology applications in medicine and healthcare' },
  { id: 'pharma', name: 'Pharmaceuticals', description: 'Drug discovery and development' },
  { id: 'public-health', name: 'Public Health', description: 'Population health and disease prevention' },
  { id: 'clinical-trials', name: 'Clinical Trials', description: 'Systematic testing of medical interventions' }
];

// Get all specialization fields
export const getSpecializationFields = async (): Promise<SpecializationField[]> => {
  return specializations;
};

// Create a new research contribution
export const createContribution = async (
  title: string,
  abstract: string,
  content: string,
  authorFid: number,
  authorName: string,
  tags: string[],
  links: {
    type: 'paper' | 'dataset' | 'code' | 'external';
    url: string;
    description?: string;
  }[],
  collaborators?: {
    fid: number;
    name?: string;
    role: string;
  }[]
): Promise<ResearchContribution> => {
  try {
    const timestamp = Date.now();
    
    const contribution: ResearchContribution = {
      id: uuidv4(),
      title,
      abstract,
      content,
      authorFid,
      authorName,
      timestamp,
      tags,
      links,
      status: 'published',
      reviewStatus: 'pending',
      collaborators
    };
    
    // Store the contribution
    contributions.push(contribution);
    
    // Update the author's reputation
    await updateUserReputation(authorFid, 20, 'paper', tags[0]);
    
    // Award tokens to the author for contributing research
    await recordTokenTransaction(
      authorFid,
      50,
      'contribution',
      undefined, // system generated
      contribution.id
    );
    
    // Award tokens to collaborators if any
    if (collaborators && collaborators.length > 0) {
      for (const collaborator of collaborators) {
        await updateUserReputation(collaborator.fid, 10, 'collaboration', tags[0]);
        await recordTokenTransaction(
          collaborator.fid,
          20,
          'contribution',
          undefined, // system generated
          contribution.id
        );
      }
    }
    
    return contribution;
  } catch (error) {
    console.error('Error creating contribution:', error);
    throw new Error('Failed to create research contribution');
  }
};

// Get a specific contribution by id
export const getContribution = async (id: string): Promise<ResearchContribution | null> => {
  try {
    const contribution = contributions.find(c => c.id === id);
    return contribution || null;
  } catch (error) {
    console.error('Error getting contribution:', error);
    throw new Error('Failed to retrieve contribution');
  }
};

// Get all research contributions (with optional filters)
export const getContributions = async (
  authorFid?: number,
  tags?: string[],
  status?: 'draft' | 'published' | 'peer_reviewed' | 'verified'
): Promise<ResearchContribution[]> => {
  try {
    let result = [...contributions];
    
    if (authorFid) {
      result = result.filter(c => c.authorFid === authorFid);
    }
    
    if (tags && tags.length > 0) {
      result = result.filter(c => tags.some(tag => c.tags.includes(tag)));
    }
    
    if (status) {
      result = result.filter(c => c.status === status);
    }
    
    // Sort by timestamp, newest first
    return result.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting contributions:', error);
    throw new Error('Failed to retrieve contributions');
  }
};

// Submit a peer review for a contribution
export const submitReview = async (
  contributionId: string,
  reviewerFid: number,
  reviewerName: string,
  content: string,
  rating: number
): Promise<ResearchReview> => {
  try {
    // Check if contribution exists
    const contribution = await getContribution(contributionId);
    if (!contribution) {
      throw new Error('Contribution not found');
    }
    
    // Check if reviewer has already reviewed this contribution
    const existingReview = reviews.find(r => 
      r.contributionId === contributionId && r.reviewerFid === reviewerFid
    );
    
    if (existingReview) {
      throw new Error('You have already reviewed this contribution');
    }
    
    const review: ResearchReview = {
      id: uuidv4(),
      contributionId,
      reviewerFid,
      reviewerName,
      content,
      rating,
      timestamp: Date.now(),
      votes: []
    };
    
    // Store the review
    reviews.push(review);
    
    // Update contribution reviews array
    if (!contribution.peerReviews) {
      contribution.peerReviews = [];
    }
    contribution.peerReviews.push(review.id);
    
    // If this is the third review or more, update status to peer_reviewed
    if (contribution.peerReviews.length >= 3) {
      contribution.status = 'peer_reviewed';
      
      // Calculate average rating
      const contributionReviews = reviews.filter(r => r.contributionId === contributionId);
      const avgRating = contributionReviews.reduce((sum, r) => sum + r.rating, 0) / contributionReviews.length;
      
      // If average rating is good (≥ 4), verify the contribution
      if (avgRating >= 4) {
        const verificationHash = await verifyContribution(contribution);
        contribution.verificationProof = verificationHash;
        contribution.status = 'verified';
        
        // Award additional tokens to author for verified research
        await recordTokenTransaction(
          contribution.authorFid,
          100,
          'contribution',
          undefined,
          contributionId
        );
        
        // Award tokens to reviewers for helping verify quality research
        for (const review of contributionReviews) {
          await recordTokenTransaction(
            review.reviewerFid,
            20,
            'review',
            undefined,
            contributionId
          );
        }
      }
    }
    
    // Update reviewer's reputation
    await updateUserReputation(reviewerFid, 10, 'review', contribution.tags[0]);
    
    // Award tokens for submitting a review
    await recordTokenTransaction(
      reviewerFid,
      15,
      'review',
      undefined,
      contributionId
    );
    
    return review;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw new Error('Failed to submit review');
  }
};

// Get reviews for a specific contribution
export const getReviews = async (contributionId: string): Promise<ResearchReview[]> => {
  try {
    const contributionReviews = reviews.filter(r => r.contributionId === contributionId);
    return contributionReviews.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting reviews:', error);
    throw new Error('Failed to retrieve reviews');
  }
};

// Vote on a review
export const voteOnReview = async (
  reviewId: string,
  voterFid: number,
  value: 1 | -1
): Promise<ResearchReview> => {
  try {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    
    // Check if user has already voted
    const existingVoteIndex = review.votes.findIndex(v => v.userId === voterFid);
    
    if (existingVoteIndex !== -1) {
      // Update existing vote
      review.votes[existingVoteIndex].value = value;
      review.votes[existingVoteIndex].timestamp = Date.now();
    } else {
      // Add new vote
      review.votes.push({
        userId: voterFid,
        value,
        timestamp: Date.now()
      });
    }
    
    // If upvote, award tokens to reviewer
    if (value === 1) {
      await recordTokenTransaction(
        review.reviewerFid,
        2,
        'upvote',
        voterFid,
        review.contributionId
      );
      
      // Update reviewer reputation
      await updateUserReputation(review.reviewerFid, 2, 'upvote');
    }
    
    return review;
  } catch (error) {
    console.error('Error voting on review:', error);
    throw new Error('Failed to vote on review');
  }
};

// Nominate a contribution for community recognition
export const nominateContribution = async (
  contributionId: string,
  nominatorFid: number,
  category: string
): Promise<ResearchContribution> => {
  try {
    const contribution = await getContribution(contributionId);
    if (!contribution) {
      throw new Error('Contribution not found');
    }
    
    // In a real implementation, store nomination in a nominations collection
    
    // Award tokens to contribution author for nomination
    await recordTokenTransaction(
      contribution.authorFid,
      25,
      'nomination',
      nominatorFid,
      contributionId
    );
    
    // Update reputation of author
    await updateUserReputation(contribution.authorFid, 15, 'nomination', category);
    
    return contribution;
  } catch (error) {
    console.error('Error nominating contribution:', error);
    throw new Error('Failed to nominate contribution');
  }
}; 
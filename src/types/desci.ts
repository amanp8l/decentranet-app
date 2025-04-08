export interface ResearchContribution {
  id: string;
  title: string;
  abstract: string;
  content: string;
  authorFid: number;
  authorName?: string;
  timestamp: number;
  tags: string[];
  links: {
    type: 'paper' | 'dataset' | 'code' | 'external';
    url: string;
    description?: string;
  }[];
  status: 'draft' | 'published' | 'peer_reviewed' | 'verified';
  reviewStatus?: 'pending' | 'reviewing' | 'approved' | 'rejected';
  peerReviews?: string[]; // Array of review IDs
  collaborators?: {
    fid: number;
    name?: string;
    role: string;
  }[];
  verificationProof?: string; // Blockchain hash for verification
  farcasterHash?: string; // Hash of the Farcaster cast for this contribution
}

export interface ResearchReview {
  id: string;
  contributionId: string;
  reviewerFid: number;
  reviewerName?: string;
  content: string;
  rating: number; // 1-5 scale
  timestamp: number;
  votes: {
    userId: number;
    value: 1 | -1;
    timestamp: number;
  }[];
  verificationProof?: string; // Blockchain hash for verification
}

export interface UserReputation {
  fid: number;
  username?: string;
  displayName?: string;
  reputationScore: number;
  specializations: {
    field: string;
    score: number;
  }[];
  verifications: {
    type: 'academic' | 'clinical' | 'industry' | 'research';
    institution?: string;
    proofHash?: string; // Blockchain verification hash
    verifiedAt: number;
  }[];
  contributions: {
    type: 'paper' | 'review' | 'comment' | 'collaboration';
    count: number;
    score: number;
  }[];
  badges: {
    id: string;
    name: string;
    description: string;
    awardedAt: number;
    proofHash?: string; // Blockchain verification hash
  }[];
}

export interface TokenTransaction {
  id: string;
  fromFid?: number; // Optional, can be system generated
  toFid: number;
  amount: number;
  reason: 'contribution' | 'review' | 'upvote' | 'nomination' | 'grant' | 'other';
  contributionId?: string; // Optional reference to a contribution
  timestamp: number;
  txHash?: string; // Blockchain transaction hash
}

export interface ResearchGrant {
  id: string;
  title: string;
  description: string;
  amount: number;
  sponsor: {
    fid?: number;
    name: string;
    type: 'individual' | 'institution' | 'dao';
  };
  criteria: string;
  applicationDeadline: number;
  status: 'open' | 'reviewing' | 'awarded' | 'completed';
  applicants?: {
    fid: number;
    applicationId: string;
    timestamp: number;
  }[];
  awardedTo?: {
    fid: number;
    name?: string;
    awardedAt: number;
    txHash?: string; // Blockchain transaction hash
  };
}

export interface SpecializationField {
  id: string;
  name: string;
  parentId?: string; // For hierarchical categorization
  description?: string;
}

export interface ResearchBadge {
  id: string;
  name: string;
  description: string;
  criteria: string;
  image: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  category: 'research' | 'review' | 'collaboration' | 'community' | 'achievement';
} 
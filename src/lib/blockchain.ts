import { ethers } from 'ethers';
import { UserReputation, TokenTransaction, ResearchContribution } from '@/types/desci';
import { v4 as uuidv4 } from 'uuid';

// Mock JSON-RPC provider for development purposes
// In production, use a real provider like Alchemy, Infura, or directly to a node
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');

// Mock contract ABIs - these would be actual ABIs in production
const REPUTATION_ABI = [
  // Read functions
  'function getReputation(address user) view returns (uint256)',
  'function getSpecializationScore(address user, string field) view returns (uint256)',
  // Write functions
  'function updateReputation(address user, uint256 score) returns (bool)',
  'function awardBadge(address user, string badgeId) returns (bool)',
];

const TOKEN_ABI = [
  // Read functions
  'function balanceOf(address account) view returns (uint256)',
  // Write functions
  'function transfer(address to, uint256 amount) returns (bool)',
  'function award(address to, uint256 amount, string reason) returns (bool)',
];

// Contract addresses - would be real contract addresses in production
const REPUTATION_CONTRACT = '0x0000000000000000000000000000000000000000';
const TOKEN_CONTRACT = '0x0000000000000000000000000000000000000000';

// ----- For development purposes -----
// In-memory storage for reputation and tokens during development
let reputationStore: Record<number, UserReputation> = {};
let tokenTransactions: TokenTransaction[] = [];
let contributionVerifications: Record<string, string> = {};

// Helper to get wallet from user FID (simplified for demo)
const getWalletAddress = (fid: number): string => {
  return `0x${fid.toString(16).padStart(40, '0')}`;
};

// Get user reputation
export const getUserReputation = async (fid: number): Promise<UserReputation> => {
  try {
    // In production, this would query the blockchain
    // const contract = new ethers.Contract(REPUTATION_CONTRACT, REPUTATION_ABI, provider);
    // const score = await contract.getReputation(getWalletAddress(fid));
    
    // For development, use in-memory store
    if (!reputationStore[fid]) {
      reputationStore[fid] = {
        fid,
        reputationScore: 0,
        specializations: [],
        verifications: [],
        contributions: [],
        badges: []
      };
    }
    
    return reputationStore[fid];
  } catch (error) {
    console.error('Error getting reputation:', error);
    throw new Error('Failed to retrieve reputation data');
  }
};

// Update user reputation
export const updateUserReputation = async (
  fid: number, 
  amount: number, 
  reason: string,
  field?: string
): Promise<UserReputation> => {
  try {
    // Get current reputation
    const reputation = await getUserReputation(fid);
    
    // Update overall score
    reputation.reputationScore += amount;
    
    // Update specialization if provided
    if (field) {
      const existingSpecialization = reputation.specializations.find(s => s.field === field);
      if (existingSpecialization) {
        existingSpecialization.score += amount;
      } else {
        reputation.specializations.push({
          field,
          score: amount
        });
      }
    }
    
    // Update contribution stats
    const contributionType = reason as 'paper' | 'review' | 'comment' | 'collaboration';
    const existingContribution = reputation.contributions.find(c => c.type === contributionType);
    if (existingContribution) {
      existingContribution.count += 1;
      existingContribution.score += amount;
    } else {
      reputation.contributions.push({
        type: contributionType,
        count: 1,
        score: amount
      });
    }
    
    // Store updated reputation
    reputationStore[fid] = reputation;
    
    // In production, update on blockchain
    // const wallet = new ethers.Wallet('PRIVATE_KEY', provider);
    // const contract = new ethers.Contract(REPUTATION_CONTRACT, REPUTATION_ABI, wallet);
    // await contract.updateReputation(getWalletAddress(fid), reputation.reputationScore);
    
    return reputation;
  } catch (error) {
    console.error('Error updating reputation:', error);
    throw new Error('Failed to update reputation');
  }
};

// Verify credentials (academic, clinical, etc.)
export const verifyCredentials = async (
  fid: number,
  verificationType: 'academic' | 'clinical' | 'industry' | 'research',
  institution?: string
): Promise<UserReputation> => {
  try {
    const reputation = await getUserReputation(fid);
    
    // Create verification record with mock proof hash
    const proofHash = `0x${Math.random().toString(16).substring(2, 14)}`;
    
    reputation.verifications.push({
      type: verificationType,
      institution,
      proofHash,
      verifiedAt: Date.now()
    });
    
    // Add reputation points based on verification type
    const reputationBoost = 50; // Base points for verification
    await updateUserReputation(fid, reputationBoost, 'verification');
    
    return reputation;
  } catch (error) {
    console.error('Error verifying credentials:', error);
    throw new Error('Failed to verify credentials');
  }
};

// Award badge to user
export const awardBadge = async (
  fid: number,
  badgeId: string,
  badgeName: string,
  badgeDescription: string
): Promise<UserReputation> => {
  try {
    const reputation = await getUserReputation(fid);
    
    // Create badge record with mock proof hash
    const proofHash = `0x${Math.random().toString(16).substring(2, 14)}`;
    
    reputation.badges.push({
      id: badgeId,
      name: badgeName,
      description: badgeDescription,
      awardedAt: Date.now(),
      proofHash
    });
    
    // In production, update on blockchain
    // const wallet = new ethers.Wallet('PRIVATE_KEY', provider);
    // const contract = new ethers.Contract(REPUTATION_CONTRACT, REPUTATION_ABI, wallet);
    // await contract.awardBadge(getWalletAddress(fid), badgeId);
    
    return reputation;
  } catch (error) {
    console.error('Error awarding badge:', error);
    throw new Error('Failed to award badge');
  }
};

// Record a token transaction
export const recordTokenTransaction = async (
  toFid: number,
  amount: number,
  reason: 'contribution' | 'review' | 'upvote' | 'nomination' | 'grant' | 'other',
  fromFid?: number,
  contributionId?: string
): Promise<TokenTransaction> => {
  try {
    const transaction: TokenTransaction = {
      id: uuidv4(),
      fromFid,
      toFid,
      amount,
      reason,
      contributionId,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).substring(2, 14)}`
    };
    
    // Store transaction in memory
    tokenTransactions.push(transaction);
    
    // In production, execute on blockchain
    // const wallet = new ethers.Wallet('PRIVATE_KEY', provider);
    // const contract = new ethers.Contract(TOKEN_CONTRACT, TOKEN_ABI, wallet);
    // await contract.award(getWalletAddress(toFid), amount, reason);
    
    return transaction;
  } catch (error) {
    console.error('Error recording token transaction:', error);
    throw new Error('Failed to record token transaction');
  }
};

// Get user token balance
export const getTokenBalance = async (fid: number): Promise<number> => {
  try {
    // Calculate balance from transactions
    const received = tokenTransactions
      .filter(tx => tx.toFid === fid)
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const sent = tokenTransactions
      .filter(tx => tx.fromFid === fid) // Only count transactions where this user is explicitly the sender
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    return received - sent;
    
    // In production, query blockchain
    // const contract = new ethers.Contract(TOKEN_CONTRACT, TOKEN_ABI, provider);
    // const balance = await contract.balanceOf(getWalletAddress(fid));
    // return Number(balance);
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw new Error('Failed to get token balance');
  }
};

// Transfer tokens between users
export const transferTokens = async (
  fromFid: number,
  toFid: number,
  amount: number,
  reason: 'contribution' | 'review' | 'upvote' | 'nomination' | 'grant' | 'other',
  contributionId?: string
): Promise<TokenTransaction> => {
  try {
    // Check that amount is positive
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }
    
    // Prevent self-transfers
    if (fromFid === toFid) {
      throw new Error('Cannot transfer tokens to yourself');
    }
    
    // Check if sender has sufficient balance
    const senderBalance = await getTokenBalance(fromFid);
    if (senderBalance < amount) {
      throw new Error('Insufficient token balance for transfer');
    }
    
    // Create the transaction
    const transaction: TokenTransaction = {
      id: uuidv4(),
      fromFid,
      toFid,
      amount,
      reason,
      contributionId,
      timestamp: Date.now(),
      txHash: `0x${Math.random().toString(16).substring(2, 14)}`
    };
    
    // Store transaction in memory
    tokenTransactions.push(transaction);
    
    // In production, execute on blockchain
    // const wallet = new ethers.Wallet('PRIVATE_KEY', provider);
    // const contract = new ethers.Contract(TOKEN_CONTRACT, TOKEN_ABI, wallet);
    // await contract.transfer(getWalletAddress(toFid), amount);
    
    return transaction;
  } catch (error) {
    console.error('Error transferring tokens:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to transfer tokens');
  }
};

// Get token transactions for a user
export const getTokenTransactions = async (fid: number): Promise<TokenTransaction[]> => {
  try {
    // Get transactions where user is sender or recipient
    const userTransactions = tokenTransactions.filter(tx => 
      tx.fromFid === fid || tx.toFid === fid
    );
    
    // Sort by timestamp, newest first
    return userTransactions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting token transactions:', error);
    throw new Error('Failed to retrieve token transaction history');
  }
};

// Verify a research contribution on blockchain
export const verifyContribution = async (contribution: ResearchContribution): Promise<string> => {
  try {
    // Create a hash of the contribution data
    const contributionData = JSON.stringify({
      id: contribution.id,
      title: contribution.title,
      abstract: contribution.abstract,
      authorFid: contribution.authorFid,
      timestamp: contribution.timestamp
    });
    
    const hash = ethers.keccak256(ethers.toUtf8Bytes(contributionData));
    
    // Store verification in memory
    contributionVerifications[contribution.id] = hash;
    
    // In production, store on blockchain
    // const wallet = new ethers.Wallet('PRIVATE_KEY', provider);
    // const contract = new ethers.Contract(VERIFICATION_CONTRACT, VERIFICATION_ABI, wallet);
    // await contract.verifyContribution(contribution.id, hash);
    
    return hash;
  } catch (error) {
    console.error('Error verifying contribution:', error);
    throw new Error('Failed to verify contribution');
  }
};

// Check if a contribution is verified
export const isContributionVerified = async (contributionId: string): Promise<boolean> => {
  return !!contributionVerifications[contributionId];
}; 
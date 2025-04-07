// Type definitions for social features

export interface Vote {
  userId: number; // FID of the user who voted
  value: 1 | -1;  // 1 for upvote, -1 for downvote
  timestamp: number;
}

export interface CommentData {
  id: string;
  text: string;
  authorFid: number;
  timestamp: number;
  parentId?: string; // Optional: null/undefined for direct comments, set for replies
  votes: Vote[];
  replies?: string[]; // Array of reply comment IDs
}

export interface CastWithSocial {
  id: string;
  hash: string;
  fid: number;
  username?: string;
  displayName?: string;
  avatar?: string | null;
  data: {
    text: string;
    timestamp: number;
    mentions: number[];
    mentionsPositions: number[];
    embeds: any[];
    author?: {
      username: string;
      displayName?: string;
      pfp?: string;
    };
  };
  createdAt: string;
  votes: Vote[];
  commentCount: number;
  comments?: string[]; // Array of comment IDs
}

export interface UserStats {
  postCount: number;
  commentCount: number;
  receivedUpvotes: number;
  receivedDownvotes: number;
  givenUpvotes: number;
  givenDownvotes: number;
} 
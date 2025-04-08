export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  iconName?: string;
  topicCount: number;
  order: number;
}

export interface ForumTopic {
  id: string;
  title: string;
  content: string;
  authorFid: number;
  authorName?: string;
  categoryId: string;
  timestamp: number;
  lastReplyTimestamp?: number;
  lastReplyAuthorFid?: number;
  lastReplyAuthorName?: string;
  replyCount: number;
  viewCount: number;
  isPinned?: boolean;
  isLocked?: boolean;
  tags?: string[];
  votes?: {
    userId: number;
    value: 1 | -1;
    timestamp: number;
  }[];
  farcasterHash?: string;
}

export interface ForumReply {
  id: string;
  topicId: string;
  content: string;
  authorFid: number;
  authorName?: string;
  timestamp: number;
  parentId?: string; // For nested replies
  isAnswer?: boolean; // For marking accepted answers
  votes: {
    userId: number;
    value: 1 | -1;
    timestamp: number;
  }[];
  farcasterHash?: string; // Hash of the Farcaster cast for this reply
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
} 
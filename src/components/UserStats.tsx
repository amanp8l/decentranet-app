'use client';

import { UserStats as UserStatsType } from '@/types/social';

interface UserStatsProps {
  fid: number;
  stats?: UserStatsType;
  className?: string;
  showFid?: boolean;
  showDetailed?: boolean;
}

// Calculate user points based on votes and comments
export const calculateUserPoints = (stats?: UserStatsType) => {
  if (!stats) return 0;
  
  // Points formula:
  // 3 point for each comment or reply
  // 5 points for each received upvote
  // -2 points for each received downvote
  // The minimum total is 0
  
  const commentPoints = (stats.commentCount || 0) * 3;
  const upvotePoints = (stats.receivedUpvotes || 0) * 5;
  const downvotePoints = (stats.receivedDownvotes || 0) * (-2);
  
  return Math.max(0, commentPoints + upvotePoints + downvotePoints);
};

export default function UserStats({ fid, stats, className = "", showFid = true, showDetailed = false }: UserStatsProps) {
  const points = calculateUserPoints(stats);
  
  // Determine reputation level based on points
  let repLevel = "Newcomer";
  let repColor = "text-gray-500";
  
  if (points >= 1000) {
    repLevel = "Legend";
    repColor = "text-purple-700";
  } else if (points >= 500) {
    repLevel = "Expert";
    repColor = "text-purple-600";
  } else if (points >= 200) {
    repLevel = "Established";
    repColor = "text-blue-600";
  } else if (points >= 50) {
    repLevel = "Regular";
    repColor = "text-green-600";
  }

  // Calculate a rough estimate of points from replies (for display purposes)
  const hasCommentedOrReplied = stats?.commentCount && stats.commentCount > 0;
  const replyPoints = hasCommentedOrReplied ? Math.min(5, stats.commentCount) : 0;

  return (
    <div className={`flex flex-col ${className}`}>
      {showFid && (
        <div className="text-gray-500 mb-1">
          <span className="mr-2">FID:</span>
          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-purple-600">{fid}</span>
        </div>
      )}
      
      <div className="flex items-center">
        <span className="mr-2 text-gray-500">Points:</span>
        <span 
          className="font-semibold text-purple-600 cursor-help" 
          title="Points Formula: 1 point per comment, 1 point per reply, 5 points per upvote, -2 points per downvote (minimum: 0)"
        >
          {points}
        </span>
        <span className={`ml-2 text-xs ${repColor}`}>({repLevel})</span>
      </div>
      
      {showDetailed && stats && (
        <div className="mt-2 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Comments:</span>
            <span>{stats.commentCount || 0}</span>
          </div>
          <div className="flex justify-between pl-4 text-gray-400 text-xs italic">
            <span>Includes both comments and replies</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Received Upvotes:</span>
            <span className="text-green-600">+{stats.receivedUpvotes || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Received Downvotes:</span>
            <span className="text-red-500">-{stats.receivedDownvotes || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
} 
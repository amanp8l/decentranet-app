'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useUser } from '@/context/UserContext';
import { formatText } from '@/utils/textFormatting';

interface CastData {
  text: string;
  mentions: number[];
  mentionsPositions: number[];
  embeds: any[];
  timestamp: number;
  author?: {
    username: string;
    displayName?: string;
    pfp?: string;
  };
}

interface Vote {
  userId: number;
  value: 1 | -1;
  timestamp: number;
}

interface Comment {
  id: string;
  text: string;
  authorFid: number;
  timestamp: number;
  parentId?: string;
  votes: Vote[];
  replies?: string[];
  author?: {
    username: string;
    displayName?: string;
    pfp?: string;
  };
}

interface Cast {
  id: string;
  fid: number;
  data: CastData;
  votes?: Vote[];
  commentCount?: number;
  comments?: string[];
}

interface CastFeedProps {
  userFid?: number;
  onViewProfile?: (fid: number) => void;
}

// Comment component for displaying a single comment
const CommentItem = ({ 
  comment, 
  castId, 
  onReply, 
  onVote, 
  currentUser,
  onViewProfile
}: { 
  comment: Comment; 
  castId: string; 
  onReply: (commentId: string) => void;
  onVote: (commentId: string, value: 1 | -1) => void;
  currentUser: any;
  onViewProfile?: (fid: number) => void;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  
  // Calculate total votes
  const upvotes = comment.votes?.filter(v => v.value === 1).length || 0;
  const downvotes = comment.votes?.filter(v => v.value === -1).length || 0;
  const totalVotes = upvotes - downvotes;
  
  // Check if current user has voted on this comment
  const currentUserVote = currentUser && comment.votes?.find(v => v.userId === currentUser.fid)?.value;
  
  // Function to toggle replies visibility and load replies if needed
  const toggleReplies = async () => {
    if (comment.replies && comment.replies.length > 0) {
      setShowReplies(!showReplies);
      
      // If we're showing replies and haven't loaded them yet, fetch them
      if (!showReplies && replies.length === 0) {
        setIsLoadingReplies(true);
        try {
          const response = await fetch(`/api/casts/comment?castId=${castId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && Array.isArray(data.comments)) {
              // Filter to only include replies to this comment
              const commentReplies = data.comments.filter(
                (r: Comment) => r.parentId === comment.id
              );
              setReplies(commentReplies);
            }
          }
        } catch (error) {
          console.error('Error loading replies:', error);
        } finally {
          setIsLoadingReplies(false);
        }
      }
    }
  };
  
  return (
    <div className="pl-4 border-l-2 border-gray-100 mb-3">
      <div className="flex items-start mb-2">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 mr-2 flex-shrink-0 relative">
          {comment.author?.pfp ? (
            <Image 
              src={comment.author.pfp} 
              alt={comment.author.username || `FID: ${comment.authorFid}`}
              width={24}
              height={24}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-xs">
              {comment.author?.username?.charAt(0)?.toUpperCase() || comment.authorFid.toString().charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline">
            <button 
              onClick={() => onViewProfile && onViewProfile(comment.authorFid)}
              className="font-medium text-sm hover:text-purple-600 truncate"
            >
              {comment.author?.displayName || comment.author?.username || `User ${comment.authorFid}`}
            </button>
            <span className="ml-2 text-xs text-gray-500">
              {new Date(comment.timestamp).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="text-sm mt-1">{formatText(comment.text, onViewProfile)}</div>
          
          {/* Comment actions */}
          <div className="flex items-center mt-2 text-xs text-gray-500 space-x-4">
            {/* Vote buttons */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => onVote(comment.id, 1)}
                className={`p-1 rounded hover:bg-gray-100 ${currentUserVote === 1 ? 'text-purple-600' : ''}`}
                disabled={!currentUser}
                title={currentUser ? "Upvote" : "Log in to vote"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
                </svg>
              </button>
              <span className={totalVotes > 0 ? 'text-purple-600' : totalVotes < 0 ? 'text-red-500' : ''}>
                {totalVotes !== 0 ? totalVotes : ''}
              </span>
              <button 
                onClick={() => onVote(comment.id, -1)}
                className={`p-1 rounded hover:bg-gray-100 ${currentUserVote === -1 ? 'text-red-500' : ''}`}
                disabled={!currentUser}
                title={currentUser ? "Downvote" : "Log in to vote"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M7.423 15.122a.75.75 0 01-.919.53l-4.78-1.281a.75.75 0 01-.531-.919l1.281-4.78a.75.75 0 011.449.387l-.81 3.022a19.407 19.407 0 005.594-5.203.75.75 0 011.139-.093l3.154 3.154 4.72-4.72a.75.75 0 011.06 1.06l-5.25 5.25a.75.75 0 01-1.06 0L7.88 8.17a20.923 20.923 0 01-5.545 4.931l3.042.815a.75.75 0 01.53.919z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Reply button */}
            <button 
              className="hover:text-purple-600"
              onClick={() => onReply(comment.id)}
              disabled={!currentUser}
              title={currentUser ? "Reply" : "Log in to reply"}
            >
              Reply
            </button>
            
            {/* Show/hide replies button */}
            {comment.replies && comment.replies.length > 0 && (
              <button 
                onClick={toggleReplies}
                className="hover:text-purple-600"
              >
                {showReplies ? 'Hide replies' : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Replies */}
      {showReplies && (
        <div className="pl-6 mt-2">
          {isLoadingReplies ? (
            <div className="text-xs text-gray-500">Loading replies...</div>
          ) : (
            replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                castId={castId}
                onReply={(commentId) => onReply(commentId)}
                onVote={(commentId, value) => onVote(commentId, value)}
                currentUser={currentUser}
                onViewProfile={onViewProfile}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default function CastFeed({ userFid, onViewProfile }: CastFeedProps) {
  const { user } = useUser();
  const [casts, setCasts] = useState<Cast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedTitle, setFeedTitle] = useState("Recent Casts");
  const [viewingFid, setViewingFid] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'following'>('recent');
  
  // State for comments
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<{castId: string, commentId?: string} | null>(null);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Set the viewing FID when the userFid prop changes
    setViewingFid(userFid ?? null);
    
    // Update feed title based on whether we're viewing a specific user
    if (userFid) {
      // First set a basic title
      setFeedTitle(`User Feed`);
      
      // Try to fetch user data to get a better title
      const fetchUserData = async () => {
        try {
          const response = await fetch(`/api/users/${userFid}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              const username = data.user.displayName || data.user.username || `User ${userFid}`;
              setFeedTitle(`${username}'s Posts`);
            }
          }
        } catch (error) {
          console.error('Error fetching user data for title:', error);
        }
      };
      
      fetchUserData();
      setActiveTab('recent'); // Reset to recent tab when viewing a specific user
    } else {
      setFeedTitle(activeTab === 'following' ? "Following Feed" : "Recent Casts");
    }
  }, [userFid, activeTab]);

  // Function to fetch casts
  const fetchCasts = useCallback(async () => {
    setIsLoading(true);
    
    try {
      let endpoint = '/api/casts';
      
      // If viewing a specific user's feed
      if (userFid) {
        endpoint += `?fid=${userFid}`;
      } 
      // If viewing the following feed
      else if (activeTab === 'following' && user) {
        endpoint = `/api/casts/following?fid=${user.fid}`;
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch casts: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setCasts(data.data);
      } else {
        console.error('Invalid response format:', data);
        setCasts([]);
      }
    } catch (error) {
      console.error('Error fetching casts:', error);
      setCasts([]);
    } finally {
      setIsLoading(false);
    }
  }, [userFid, activeTab, user]);

  // Fetch casts when the component mounts or when dependencies change
  useEffect(() => {
    fetchCasts();
  }, [fetchCasts]);
  
  // Listen for feed-update events
  useEffect(() => {
    const handleFeedUpdate = () => {
      fetchCasts();
    };
    
    window.addEventListener('feed-update', handleFeedUpdate);
    
    return () => {
      window.removeEventListener('feed-update', handleFeedUpdate);
    };
  }, [fetchCasts]);

  // Function to switch between tabs
  const switchTab = (tab: 'recent' | 'following') => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      setFeedTitle(tab === 'following' ? "Following Feed" : "Recent Casts");
    }
  };
  
  // Function to view a specific user's feed
  const viewUserFeed = (fid: number) => {
    if (onViewProfile) {
      onViewProfile(fid);
    } else {
      setViewingFid(fid);
      // First set a basic title
      setFeedTitle(`User Feed`);
      
      // Try to fetch user data to get a better title
      const fetchUserData = async () => {
        try {
          const response = await fetch(`/api/users/${fid}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              const username = data.user.displayName || data.user.username || `User ${fid}`;
              setFeedTitle(`${username}'s Posts`);
            }
          }
        } catch (error) {
          console.error('Error fetching user data for title:', error);
        }
      };
      
      fetchUserData();
      
      // Update the URL to reflect the user we're viewing
      const url = new URL(window.location.href);
      url.searchParams.set('view', fid.toString());
      window.history.pushState({}, '', url);
      
      // Fetch the user's casts
      fetchCasts();
    }
  };
  
  // Function to return to the main feed
  const viewMainFeed = () => {
    setViewingFid(null);
    setFeedTitle("Recent Casts");
    
    // Remove the view parameter from the URL
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    window.history.pushState({}, '', url);
    
    // Fetch main feed
    fetchCasts();
  };

  // Function to handle voting on a cast
  const handleVote = async (castId: string, value: 1 | -1, targetUserId: number) => {
    if (!user) {
      setError('You need to be logged in to vote');
      return;
    }
    
    try {
      const response = await fetch('/api/casts/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          castId,
          userId: user.fid,
          targetUserId,
          value
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the votes in the UI
          setCasts(prevCasts => 
            prevCasts.map(cast => 
              cast.id === castId ? { ...cast, votes: data.votes } : cast
            )
          );
        }
      } else {
        setError('Failed to vote. Please try again.');
      }
    } catch (error) {
      console.error('Error voting:', error);
      setError('Failed to vote. Please try again.');
    }
  };
  
  // Function to handle voting on a comment
  const handleCommentVote = async (castId: string, commentId: string, value: 1 | -1) => {
    if (!user) {
      setError('You need to be logged in to vote');
      return;
    }
    
    try {
      const response = await fetch('/api/casts/comment', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          castId,
          commentId,
          userId: user.fid,
          value
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update the comment in the UI
          setComments(prevComments => {
            const castComments = [...(prevComments[castId] || [])];
            const updateComment = (comments: Comment[]) => {
              return comments.map(comment => {
                if (comment.id === commentId) {
                  return { ...comment, votes: data.comment.votes };
                }
                return comment;
              });
            };
            
            return {
              ...prevComments,
              [castId]: updateComment(castComments)
            };
          });
        }
      } else {
        setError('Failed to vote on comment. Please try again.');
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
      setError('Failed to vote on comment. Please try again.');
    }
  };
  
  // Function to toggle comments display for a cast
  const toggleComments = async (castId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [castId]: !prev[castId]
    }));
    
    // If expanding and we don't have comments loaded yet, fetch them
    if (!expandedComments[castId] && (!comments[castId] || comments[castId].length === 0)) {
      setLoadingComments(prev => ({
        ...prev,
        [castId]: true
      }));
      
      try {
        const response = await fetch(`/api/casts/comment?castId=${castId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setComments(prev => ({
              ...prev,
              [castId]: data.comments
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoadingComments(prev => ({
          ...prev,
          [castId]: false
        }));
      }
    }
  };
  
  // Function to handle comment submission
  const handleCommentSubmit = async (castId: string) => {
    if (!user) {
      setError('You need to be logged in to comment');
      return;
    }
    
    if (!commentText.trim()) {
      return;
    }
    
    try {
      const response = await fetch('/api/casts/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          castId,
          text: commentText,
          authorFid: user.fid,
          parentId: replyingTo?.commentId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add the new comment to the UI
          setComments(prev => {
            const castComments = [...(prev[castId] || [])];
            return {
              ...prev,
              [castId]: [...castComments, data.comment]
            };
          });
          
          // Update comment count on the cast
          setCasts(prevCasts => 
            prevCasts.map(cast => 
              cast.id === castId ? { 
                ...cast, 
                commentCount: (cast.commentCount || 0) + 1 
              } : cast
            )
          );
          
          // Clear the input and reply state
          setCommentText('');
          setReplyingTo(null);
        }
      } else {
        setError('Failed to post comment. Please try again.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment. Please try again.');
    }
  };
  
  // Set up reply to a comment
  const handleReply = (castId: string, commentId: string) => {
    setReplyingTo({ castId, commentId });
    setCommentText('');
    
    // Make sure comments are expanded
    setExpandedComments(prev => ({
      ...prev,
      [castId]: true
    }));
    
    // Focus the comment input
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 100);
  };
  
  // Cancel replying
  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{feedTitle}</h2>
          {viewingFid && !userFid && (
            <button 
              onClick={viewMainFeed}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              ← Back to main feed
            </button>
          )}
        </div>
        <button 
          onClick={fetchCasts}
          className="text-sm text-purple-600 hover:text-purple-800"
        >
          Refresh
        </button>
      </div>
      
      {/* Feed Type Tabs - Only show when not viewing a specific user */}
      {!userFid && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => switchTab('recent')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recent'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent
            </button>
            
            {user && ( // Only show Following tab if user is logged in
              <button
                onClick={() => switchTab('following')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'following'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Following
              </button>
            )}
          </nav>
        </div>
      )}
      
      {/* Login prompt for Following tab when not logged in */}
      {!user && activeTab === 'following' && (
        <div className="bg-amber-50 p-3 rounded text-amber-700 text-sm mb-4">
          Please log in to see posts from users you follow.
        </div>
      )}
      
      {isLoading && casts.length === 0 && (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading casts...</p>
        </div>
      )}
      
      {isLoading && casts.length > 0 && (
        <div className="bg-blue-50 p-2 rounded text-center text-blue-700 text-sm mb-4">
          Refreshing...
        </div>
      )}
      
      {error && (
        <div className="bg-amber-50 p-3 rounded text-amber-700 text-sm mb-4">
          {error} <button onClick={fetchCasts} className="underline ml-2">Try again</button>
        </div>
      )}
      
      {!isLoading && casts.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-2">
            {activeTab === 'following' 
              ? "No posts from users you follow yet" 
              : "No casts found"}
          </p>
          
          {activeTab === 'following' && (
            <p className="text-sm text-gray-400">
              Follow more users to see their posts here!
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {casts.map((cast, index) => (
            <div key={index} className="border border-gray-200 p-4 rounded-lg shadow-sm">
              {/* Cast header with author info */}
              <div className="flex items-start mb-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 mr-2 flex-shrink-0 relative">
                  {cast.data.author?.pfp ? (
                    <Image 
                      src={cast.data.author.pfp} 
                      alt={cast.data.author.username || `FID: ${cast.fid}`}
                      width={32}
                      height={32}
                      className="object-cover"
                      onError={(e) => {
                        // If image fails to load, show a fallback
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-xs';
                          fallback.textContent = (cast.data.author?.username?.charAt(0) || cast.fid.toString().charAt(0)).toUpperCase();
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-xs">
                      {cast.data.author?.username?.charAt(0)?.toUpperCase() || cast.fid.toString().charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <button 
                    onClick={() => !userFid && viewUserFeed(cast.fid)}
                    className={`font-medium ${!userFid ? 'hover:text-purple-600' : ''}`}
                  >
                    {cast.data.author?.displayName || cast.data.author?.username || `FID: ${cast.fid}`}
                  </button>
                  {cast.data.author?.username && (
                    <p className="text-gray-500 text-xs">@{cast.data.author.username}</p>
                  )}
                </div>
              </div>
              
              {/* Cast content */}
              <div className="mt-2 whitespace-pre-wrap">{formatText(cast.data?.text || 'No content', onViewProfile)}</div>
              
              {/* Cast timestamp */}
              <p className="text-gray-500 text-sm mt-2">
                {new Date(typeof cast.data?.timestamp === 'number' && cast.data.timestamp < 10000000000
                  ? cast.data.timestamp * 1000  // Convert seconds to milliseconds if timestamp is in seconds
                  : cast.data?.timestamp || 0).toLocaleString()}
              </p>
              
              {/* Cast actions: vote and comment */}
              <div className="flex items-center mt-3 pt-3 border-t border-gray-100 text-sm">
                {/* Vote buttons */}
                <div className="flex items-center mr-6">
                  <button 
                    onClick={() => handleVote(cast.id, 1, cast.fid)}
                    className={`p-1 rounded hover:bg-gray-100 ${
                      user && cast.votes?.some(v => v.userId === user.fid && v.value === 1) 
                        ? 'text-purple-600' : 'text-gray-500'
                    }`}
                    disabled={!user}
                    title={user ? "Upvote" : "Log in to vote"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" />
                    </svg>
                  </button>
                  <span className="mx-1 font-medium">
                    {cast.votes 
                      ? cast.votes.filter(v => v.value === 1).length - cast.votes.filter(v => v.value === -1).length 
                      : 0
                    }
                  </span>
                  <button 
                    onClick={() => handleVote(cast.id, -1, cast.fid)}
                    className={`p-1 rounded hover:bg-gray-100 ${
                      user && cast.votes?.some(v => v.userId === user.fid && v.value === -1) 
                        ? 'text-red-500' : 'text-gray-500'
                    }`}
                    disabled={!user}
                    title={user ? "Downvote" : "Log in to vote"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" />
                    </svg>
                  </button>
                </div>
                
                {/* Comment button */}
                <button 
                  onClick={() => {
                    toggleComments(cast.id);
                    if (!expandedComments[cast.id]) {
                      setReplyingTo({ castId: cast.id });
                    }
                  }}
                  className="flex items-center text-gray-500 hover:text-purple-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
                    <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.671 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.671-2.43-2.902A41.289 41.289 0 0010 2zM6.75 6a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 2.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
                  </svg>
                  {cast.commentCount || 0} {(cast.commentCount === 1) ? 'Comment' : 'Comments'}
                </button>
              </div>
              
              {/* Comments section */}
              {expandedComments[cast.id] && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {/* Comment list */}
                  {loadingComments[cast.id] ? (
                    <div className="text-center p-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="text-xs text-gray-500 mt-1">Loading comments...</p>
                    </div>
                  ) : (
                    comments[cast.id] && comments[cast.id].length > 0 ? (
                      <div className="space-y-3">
                        {/* Root-level comments (no parentId) */}
                        {comments[cast.id]
                          .filter(comment => !comment.parentId)
                          .map(comment => (
                            <CommentItem
                              key={comment.id}
                              comment={comment}
                              castId={cast.id}
                              onReply={(commentId) => handleReply(cast.id, commentId)}
                              onVote={(commentId, value) => handleCommentVote(cast.id, commentId, value)}
                              currentUser={user}
                              onViewProfile={onViewProfile}
                            />
                          ))
                        }
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm py-2">No comments yet. Be the first to comment!</p>
                    )
                  )}
                  
                  {/* Comment input form */}
                  {user ? (
                    <div className="mt-3 flex items-start">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 mr-2 flex-shrink-0 relative">
                        {user.pfp ? (
                          <Image 
                            src={user.pfp} 
                            alt={user.username || `FID: ${user.fid}`}
                            width={24}
                            height={24}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-xs">
                            {user.username?.charAt(0)?.toUpperCase() || user.fid.toString().charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        {replyingTo?.commentId && (
                          <div className="bg-gray-50 p-1 mb-1 rounded text-xs flex justify-between items-center">
                            <span className="text-gray-600">
                              Replying to comment
                            </span>
                            <button 
                              onClick={cancelReply}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                          </div>
                        )}
                        <textarea
                          ref={commentInputRef}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className="w-full border border-gray-200 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                          rows={2}
                        />
                        <div className="flex justify-end mt-1">
                          <button
                            onClick={() => handleCommentSubmit(cast.id)}
                            disabled={!commentText.trim()}
                            className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-3">
                      <a href="#login" className="text-purple-600 hover:underline">Log in</a> to leave a comment.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
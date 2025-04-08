'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ForumTopic as TopicType, ForumReply } from '@/types/forum';
import { formatText } from '@/utils/textFormatting';
import { useUser } from '@/context/UserContext';

interface ForumTopicProps {
  topicId: string;
}

export default function ForumTopic({ topicId }: ForumTopicProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  
  const [topic, setTopic] = useState<TopicType | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchTopic() {
      try {
        setLoading(true);
        const response = await fetch(`/api/forum/topic/${topicId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch topic');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setTopic(data.topic);
          setReplies(data.replies);
        } else {
          throw new Error(data.error || 'Failed to fetch topic');
        }
      } catch (err) {
        setError((err as Error).message);
        console.error('Error fetching topic:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTopic();
  }, [topicId]);

  // Function to format the date in a readable way
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleReplyTo = (replyId: string) => {
    if (!isAuthenticated) {
      return; // Don't allow replying if not logged in
    }
    
    setReplyingTo(replyId);
    
    // Scroll to reply form
    setTimeout(() => {
      document.getElementById('reply-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const handleCancelReply = () => {
    setReplyingTo(null);
  };
  
  const handleTopicVote = async (value: 1 | -1) => {
    if (!isAuthenticated || !user || !topic) {
      return; // Don't allow voting if not logged in
    }
    
    try {
      // In a real app, you would call an API to record the vote
      // For this demo, we'll update the state directly
      const votes = topic.votes || [];
      const existingVoteIndex = votes.findIndex(v => v.userId === user.fid);
      
      let updatedVotes;
      if (existingVoteIndex >= 0) {
        // Update existing vote
        updatedVotes = [...votes];
        updatedVotes[existingVoteIndex] = {
          ...updatedVotes[existingVoteIndex],
          value,
          timestamp: Date.now()
        };
      } else {
        // Add new vote
        updatedVotes = [
          ...votes,
          {
            userId: user.fid,
            value,
            timestamp: Date.now()
          }
        ];
      }
      
      // Update topic with new votes
      setTopic({
        ...topic,
        votes: updatedVotes
      });
      
      // In a real app, send the vote to the server
      const response = await fetch(`/api/forum/topic/${topicId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          value,
          userId: user.fid
        })
      }).catch(err => {
        console.error('Error saving vote:', err);
        // Optimistic UI update keeps the vote visible even if the API call fails
      });
    } catch (err) {
      console.error('Error voting on topic:', err);
    }
  };
  
  const handleReplyVote = async (replyId: string, value: 1 | -1) => {
    if (!isAuthenticated || !user) {
      return; // Don't allow voting if not logged in
    }
    
    try {
      // In a real app, you would call an API to record the vote
      // For this demo, we'll update the state directly
      const updatedReplies = replies.map(reply => {
        if (reply.id === replyId) {
          // Check if user has already voted
          const existingVoteIndex = reply.votes.findIndex(v => v.userId === user.fid);
          
          if (existingVoteIndex >= 0) {
            // Update existing vote
            const updatedVotes = [...reply.votes];
            updatedVotes[existingVoteIndex] = {
              ...updatedVotes[existingVoteIndex],
              value,
              timestamp: Date.now()
            };
            return { ...reply, votes: updatedVotes };
          } else {
            // Add new vote
            return {
              ...reply,
              votes: [
                ...reply.votes,
                {
                  userId: user.fid,
                  value,
                  timestamp: Date.now()
                }
              ]
            };
          }
        }
        return reply;
      });
      
      setReplies(updatedReplies);
    } catch (err) {
      console.error('Error voting on reply:', err);
    }
  };
  
  const handleSubmitReply = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setSubmitError('You must be logged in to reply');
      return;
    }
    
    if (!replyContent.trim()) {
      setSubmitError('Reply cannot be empty');
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const response = await fetch('/api/forum/create-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: replyContent,
          topicId,
          authorFid: user.fid,
          authorName: user.displayName || user.username || `User ${user.fid}`,
          parentId: replyingTo || undefined
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post reply');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Add the newly created reply to our list
        setReplies([...replies, data.reply]);
        setReplyContent('');
        setReplyingTo(null);
        
        // Update topic info in our state
        if (topic) {
          setTopic({
            ...topic,
            replyCount: topic.replyCount + 1,
            lastReplyTimestamp: data.reply.timestamp,
            lastReplyAuthorFid: user.fid,
            lastReplyAuthorName: user.displayName || user.username || `User ${user.fid}`
          });
        }
      } else {
        throw new Error(data.error || 'Failed to post reply');
      }
    } catch (err) {
      setSubmitError((err as Error).message);
      console.error('Error submitting reply:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  const getReplyIndentClass = (reply: ForumReply) => {
    return reply.parentId ? 'ml-8 pl-4 border-l-2 border-gray-200' : '';
  };
  
  // Function to get the total votes value for a topic
  const getTopicVoteCount = (topic: TopicType) => {
    if (!topic.votes || !topic.votes.length) return 0;
    return topic.votes.reduce((sum, vote) => sum + vote.value, 0);
  };
  
  // Function to check if the current user has already voted on the topic
  const getUserTopicVote = (topic: TopicType, userId?: number) => {
    if (!userId || !topic.votes || !topic.votes.length) return 0;
    const userVote = topic.votes.find(v => v.userId === userId);
    return userVote ? userVote.value : 0;
  };
  
  // Function to navigate to a user's profile
  const handleViewProfile = (fid: number) => {
    router.push(`/profile/${fid}`);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
            
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-start space-x-4 py-4 border-t border-gray-200">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="p-6 bg-white rounded-lg shadow border border-red-200">
        <div className="flex items-center text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-medium">Error Loading Topic</h2>
        </div>
        <p className="text-gray-700">{error || 'Topic not found'}</p>
        <button 
          onClick={() => router.back()} 
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
      {/* Topic Header */}
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <Link 
            href={`/category/${topic.categoryId}`}
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Category
          </Link>
          
          <div className="flex items-center space-x-2">
            {topic.isPinned && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-purple-100 text-purple-800">
                Pinned
              </span>
            )}
            {topic.isLocked && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                Locked
              </span>
            )}
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{topic.title}</h1>
        
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <button
            onClick={() => handleViewProfile(topic.authorFid)}
            className="text-purple-600 hover:text-purple-800 hover:underline"
          >
            {topic.authorName || `User ${topic.authorFid}`}
          </button>
          <span className="mx-1">•</span>
          <span>{formatDate(topic.timestamp)}</span>
          <span className="mx-1">•</span>
          <span>{topic.viewCount} {topic.viewCount === 1 ? 'view' : 'views'}</span>
        </div>
        
        {topic.tags && topic.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {topic.tags.map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="prose max-w-none text-gray-800 mb-4">
          {topic.content}
        </div>
        
        {/* Topic Voting */}
        <div className="flex items-center mt-4">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleTopicVote(1)}
              className={`p-1 rounded hover:bg-gray-100 ${
                isAuthenticated && getUserTopicVote(topic, user?.fid) === 1
                  ? 'text-purple-600'
                  : 'text-gray-500'
              }`}
              disabled={!isAuthenticated}
              title={isAuthenticated ? 'Upvote' : 'Login to vote'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            
            <span className={`font-medium ${
              getTopicVoteCount(topic) > 0
                ? 'text-purple-600'
                : getTopicVoteCount(topic) < 0
                  ? 'text-red-500'
                  : 'text-gray-500'
            }`}>
              {getTopicVoteCount(topic) || '0'}
            </span>
            
            <button
              onClick={() => handleTopicVote(-1)}
              className={`p-1 rounded hover:bg-gray-100 ${
                isAuthenticated && getUserTopicVote(topic, user?.fid) === -1
                  ? 'text-red-500'
                  : 'text-gray-500'
              }`}
              disabled={!isAuthenticated}
              title={isAuthenticated ? 'Downvote' : 'Login to vote'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Replies Section */}
      <div className="p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>
        
        {replies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No replies yet. Be the first to reply!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {replies.map((reply) => (
              <div 
                key={reply.id} 
                id={`reply-${reply.id}`}
                className={`${getReplyIndentClass(reply)} py-4 ${
                  replyingTo === reply.id ? 'bg-purple-50 p-4 rounded-lg' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                      {reply.authorName?.charAt(0) || 'U'}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleViewProfile(reply.authorFid)}
                        className="text-base font-medium text-purple-600 hover:text-purple-800 hover:underline"
                      >
                        {reply.authorName || `User ${reply.authorFid}`}
                      </button>
                      
                      {reply.isAnswer && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800">
                          Accepted Answer
                        </span>
                      )}
                      
                      <span className="ml-2 text-sm text-gray-500">
                        {formatDate(reply.timestamp)}
                      </span>
                    </div>
                    
                    <div className="mt-1 text-gray-800">
                      {reply.content}
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4">
                      {/* Vote Buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleReplyVote(reply.id, 1)}
                          className={`p-1 rounded hover:bg-gray-100 ${
                            isAuthenticated && reply.votes.some(v => v.userId === user?.fid && v.value === 1)
                              ? 'text-purple-600'
                              : 'text-gray-500'
                          }`}
                          disabled={!isAuthenticated}
                          title={isAuthenticated ? 'Upvote' : 'Login to vote'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        
                        <span className={`font-medium ${
                          reply.votes.reduce((sum, vote) => sum + vote.value, 0) > 0
                            ? 'text-purple-600'
                            : reply.votes.reduce((sum, vote) => sum + vote.value, 0) < 0
                              ? 'text-red-500'
                              : 'text-gray-500'
                        }`}>
                          {reply.votes.reduce((sum, vote) => sum + vote.value, 0) || '0'}
                        </span>
                        
                        <button
                          onClick={() => handleReplyVote(reply.id, -1)}
                          className={`p-1 rounded hover:bg-gray-100 ${
                            isAuthenticated && reply.votes.some(v => v.userId === user?.fid && v.value === -1)
                              ? 'text-red-500'
                              : 'text-gray-500'
                          }`}
                          disabled={!isAuthenticated}
                          title={isAuthenticated ? 'Downvote' : 'Login to vote'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Reply Button */}
                      {!topic.isLocked && (
                        <button
                          onClick={() => handleReplyTo(reply.id)}
                          className={`text-sm text-gray-500 hover:text-purple-700 ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!isAuthenticated}
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Reply Form */}
        {!topic.isLocked && (
          <div id="reply-form" className="mt-8 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {replyingTo ? 'Reply to comment' : 'Leave a reply'}
            </h3>
            
            {isAuthenticated ? (
              <form onSubmit={handleSubmitReply} className="space-y-4">
                {replyingTo && (
                  <div className="flex items-center justify-between bg-purple-50 p-2 rounded-md">
                    <span className="text-sm text-purple-700">
                      Replying to comment from {
                        replies.find(r => r.id === replyingTo)?.authorName || 'User'
                      }
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelReply}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                <div>
                  <textarea
                    rows={5}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="What are your thoughts?"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 placeholder-gray-400"
                    required
                  />
                </div>
                
                {submitError && (
                  <div className="p-2 text-sm text-red-700 bg-red-100 rounded-md">
                    {submitError}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white p-4 border border-gray-200 rounded-md text-center">
                <p className="text-gray-600 mb-2">
                  You need to be logged in to reply to this topic.
                </p>
                <Link 
                  href="/login" 
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ForumTopic } from '@/types/forum';
import { formatText } from '@/utils/textFormatting';
import { useUser } from '@/context/UserContext';

interface ForumTopicListProps {
  categoryId: string;
  categoryName?: string;
}

export default function ForumTopicList({ categoryId, categoryName }: ForumTopicListProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopics() {
      try {
        setLoading(true);
        const response = await fetch(`/api/forum/topics?categoryId=${categoryId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch topics');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setTopics(data.topics);
        } else {
          throw new Error(data.error || 'Failed to fetch topics');
        }
      } catch (err) {
        setError((err as Error).message);
        console.error('Error fetching topics:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTopics();
  }, [categoryId]);

  // Function to format the date in a readable way
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCreateTopic = () => {
    // Navigate to create topic page with category pre-selected
    router.push(`/create-topic?categoryId=${categoryId}`);
  };
  
  const handleProfileClick = (e: React.MouseEvent, fid: number) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/profile/${fid}`);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-start space-x-4 py-4 border-t border-gray-200">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow border border-red-200">
        <div className="flex items-center text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-medium">Error Loading Topics</h2>
        </div>
        <p className="text-gray-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {categoryName || 'Topics'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {topics.length} {topics.length === 1 ? 'topic' : 'topics'} in this category
          </p>
        </div>
        <button
          onClick={handleCreateTopic}
          className={`mt-4 md:mt-0 px-4 py-2 rounded-md ${
            isAuthenticated 
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          } transition-colors`}
          disabled={!isAuthenticated}
          title={isAuthenticated ? 'Create a new topic' : 'Log in to create a topic'}
        >
          New Topic
        </button>
      </div>
      
      <div className="divide-y divide-gray-200">
        {topics.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No topics have been created in this category yet.</p>
            {isAuthenticated && (
              <button
                onClick={handleCreateTopic}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Be the first to create a topic
              </button>
            )}
          </div>
        ) : (
          topics.map((topic) => (
            <Link 
              key={topic.id}
              href={`/topic/${topic.id}`}
              className="flex py-4 px-4 md:px-6 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-b-0"
            >
              <div className="flex items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    {topic.isPinned && (
                      <span className="inline-flex items-center mr-2 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Pinned
                      </span>
                    )}
                    {topic.isLocked && (
                      <span className="inline-flex items-center mr-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Locked
                      </span>
                    )}
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {topic.title}
                    </h3>
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {topic.content}
                  </p>
                  
                  {topic.tags && topic.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {topic.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <span>Posted by </span>
                    <button 
                      onClick={(e) => handleProfileClick(e, topic.authorFid)}
                      className="ml-1 text-purple-600 hover:text-purple-800 hover:underline"
                    >
                      {topic.authorName || `User ${topic.authorFid}`}
                    </button>
                    <span className="mx-1">•</span>
                    <span>{formatDate(topic.timestamp)}</span>
                    <span className="mx-1">•</span>
                    <span>{topic.replyCount} {topic.replyCount === 1 ? 'reply' : 'replies'}</span>
                    <span className="mx-1">•</span>
                    <span>{topic.viewCount} {topic.viewCount === 1 ? 'view' : 'views'}</span>
                    
                    {/* Show vote count if topic has votes */}
                    {topic.votes && topic.votes.length > 0 && (
                      <>
                        <span className="mx-1">•</span>
                        <span className={`${
                          topic.votes.reduce((sum, vote) => sum + vote.value, 0) > 0
                            ? 'text-purple-600' 
                            : topic.votes.reduce((sum, vote) => sum + vote.value, 0) < 0
                              ? 'text-red-600'
                              : ''
                        }`}>
                          {topic.votes.reduce((sum, vote) => sum + vote.value, 0)} votes
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0">
                  {topic.lastReplyTimestamp && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Last reply</div>
                      <div className="text-sm text-gray-700">{formatDate(topic.lastReplyTimestamp)}</div>
                      {topic.lastReplyAuthorName && (
                        <button
                          onClick={(e) => topic.lastReplyAuthorFid && handleProfileClick(e, topic.lastReplyAuthorFid)}
                          className="text-xs text-purple-600 hover:text-purple-800 hover:underline"
                        >
                          {topic.lastReplyAuthorName}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
} 
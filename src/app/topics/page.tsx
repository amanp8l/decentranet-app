'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ForumTopic } from '@/types/forum';
import { useUser } from '@/context/UserContext';

export default function TopicsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopics() {
      try {
        setLoading(true);
        const response = await fetch('/api/forum/topics');
        
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
  }, []);

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
    // Navigate to create topic page
    router.push('/create-topic');
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-4">
          <Link 
            href="/"
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-4">
          <Link 
            href="/"
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link 
          href="/"
          className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Topics</h1>
            <p className="mt-1 text-sm text-gray-500">
              {topics.length} {topics.length === 1 ? 'topic' : 'topics'} in total
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
              No topics available.
            </div>
          ) : (
            topics.map((topic) => (
              <Link 
                key={topic.id}
                href={`/topic/${topic.id}`}
                className="flex py-4 px-4 md:px-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start flex-1">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-medium text-gray-900 truncate">
                      {topic.title}
                      {topic.isPinned && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                          Pinned
                        </span>
                      )}
                      {topic.isLocked && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          Locked
                        </span>
                      )}
                    </h2>
                    
                    <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {topic.content}
                    </div>
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span>Posted by {topic.authorName || `User ${topic.authorFid}`}</span>
                      <span className="mx-1">•</span>
                      <span>{formatDate(topic.timestamp)}</span>
                      <span className="mx-1">•</span>
                      <span>{topic.replyCount} {topic.replyCount === 1 ? 'reply' : 'replies'}</span>
                      <span className="mx-1">•</span>
                      <span>{topic.viewCount} {topic.viewCount === 1 ? 'view' : 'views'}</span>
                    </div>
                  </div>
                  
                  {topic.lastReplyTimestamp && (
                    <div className="ml-4 flex-shrink-0 text-right text-xs text-gray-500">
                      <div>Last reply</div>
                      <div className="font-medium">{formatDate(topic.lastReplyTimestamp)}</div>
                      <div>by {topic.lastReplyAuthorName || `User ${topic.lastReplyAuthorFid}`}</div>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
} 
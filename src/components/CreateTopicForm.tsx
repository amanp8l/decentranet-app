'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ForumCategory } from '@/types/forum';
import { useUser } from '@/context/UserContext';

export default function CreateTopicForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useUser();
  
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  useEffect(() => {
    // Check if the user is authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Fetch categories
    async function fetchCategories() {
      try {
        setLoading(true);
        const response = await fetch('/api/forum/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.categories);
          
          // Check if categoryId is provided in URL
          const urlCategoryId = searchParams.get('categoryId');
          if (urlCategoryId && data.categories.some((c: ForumCategory) => c.id === urlCategoryId)) {
            setCategoryId(urlCategoryId);
          } else if (data.categories.length > 0) {
            setCategoryId(data.categories[0].id);
          }
        } else {
          throw new Error(data.error || 'Failed to fetch categories');
        }
      } catch (err) {
        setError((err as Error).message);
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCategories();
  }, [isAuthenticated, router, searchParams]);
  
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput) {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setError('You must be logged in to create a topic');
      return;
    }
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/forum/create-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          categoryId,
          authorFid: user.fid,
          authorName: user.displayName || user.username || `User ${user.fid}`,
          tags
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create topic');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Navigate to the newly created topic
        router.push(`/topic/${data.topic.id}`);
      } else {
        throw new Error(data.error || 'Failed to create topic');
      }
    } catch (err) {
      setError((err as Error).message);
      console.error('Error creating topic:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (!isAuthenticated) {
    return null; // Router will redirect to login
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="mb-6">
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
      
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Topic</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={loading || submitting}
            required
          >
            {loading ? (
              <option value="">Loading categories...</option>
            ) : categories.length === 0 ? (
              <option value="">No categories available</option>
            ) : (
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </select>
        </div>
        
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter a descriptive title"
            disabled={submitting}
            required
            maxLength={100}
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {title.length}/100 characters
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Describe your topic in detail"
            rows={8}
            disabled={submitting}
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags (up to 5)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1.5 text-blue-500 hover:text-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Add a tag"
              disabled={submitting || tags.length >= 5}
              maxLength={20}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || tags.length >= 5 || submitting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Press Enter to add a tag. Maximum 5 tags.
          </div>
        </div>
        
        <div className="flex justify-end">
          <Link
            href="/"
            className="px-4 py-2 mr-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim() || !categoryId}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Topic'}
          </button>
        </div>
      </form>
    </div>
  );
} 
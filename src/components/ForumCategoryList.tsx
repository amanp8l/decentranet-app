'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ForumCategory } from '@/types/forum';
import ForumIcon from './ForumIcon';

interface ForumCategoryListProps {
  categories?: ForumCategory[];
  loading?: boolean;
}

export default function ForumCategoryList({ categories: propCategories, loading: propLoading }: ForumCategoryListProps) {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If categories are provided as props, use them
    if (propCategories) {
      setCategories(propCategories);
      setLoading(false);
      return;
    }
    
    // If loading state is provided as a prop, use it
    if (typeof propLoading !== 'undefined') {
      setLoading(propLoading);
    }
    
    // Only fetch if categories are not provided as props
    if (!propCategories) {
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
    }
  }, [propCategories, propLoading]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          {[...Array(7)].map((_, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="w-10 h-6 bg-gray-200 rounded"></div>
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
          <h2 className="text-xl font-medium">Error Loading Forum</h2>
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
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
      <div className="p-4 md:p-6">
        <h2 className="text-xl font-bold text-gray-900">Forum Categories</h2>
        <p className="mt-1 text-sm text-gray-500">Select a category to browse topics</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {categories.map((category) => (
          <Link 
            key={category.id}
            href={`/category/${category.id}`}
            className="flex items-center p-4 md:p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 mr-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                <ForumIcon name={category.iconName || ''} className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 truncate">{category.name}</h3>
              <p className="text-sm text-gray-500 truncate">{category.description}</p>
            </div>
            
            <div className="flex-shrink-0 ml-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-purple-100 text-purple-800">
                {category.topicCount} {category.topicCount === 1 ? 'topic' : 'topics'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 
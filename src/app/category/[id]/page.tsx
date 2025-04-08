'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ForumTopicList from '@/components/ForumTopicList';
import { ForumCategory } from '@/types/forum';

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchCategory() {
      try {
        setLoading(true);
        const response = await fetch('/api/forum/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch category');
        }
        
        const data = await response.json();
        
        if (data.success) {
          const foundCategory = data.categories.find((c: ForumCategory) => c.id === categoryId);
          
          if (foundCategory) {
            setCategory(foundCategory);
          } else {
            throw new Error('Category not found');
          }
        } else {
          throw new Error(data.error || 'Failed to fetch category');
        }
      } catch (err) {
        setError((err as Error).message);
        console.error('Error fetching category:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCategory();
  }, [categoryId]);
  
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
      
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {loading ? 'Loading...' : error ? 'Error' : category?.name || 'Category'}
        </h1>
        <p className="text-gray-600 mt-1">
          {loading ? 'Loading category information...' : error ? error : category?.description}
        </p>
      </div>
      
      <ForumTopicList 
        categoryId={categoryId} 
        categoryName={category?.name}
      />
    </main>
  );
}
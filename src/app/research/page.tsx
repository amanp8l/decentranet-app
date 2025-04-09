'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { ResearchContribution, SpecializationField } from '@/types/desci';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ResearchPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  
  const [contributions, setContributions] = useState<ResearchContribution[]>([]);
  const [specializations, setSpecializations] = useState<SpecializationField[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        
        // Fetch all contributions
        let url = '/api/research/contributions';
        const params = new URLSearchParams();
        
        if (selectedTags.length > 0) {
          params.append('tags', selectedTags.join(','));
        }
        
        if (selectedStatus) {
          params.append('status', selectedStatus);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const contributionsResponse = await fetch(url);
        if (!contributionsResponse.ok) {
          throw new Error('Failed to fetch contributions');
        }
        
        const contributionsData = await contributionsResponse.json();
        if (!contributionsData.success) {
          throw new Error(contributionsData.error || 'Failed to fetch contributions');
        }
        
        setContributions(contributionsData.contributions);
        
        // Fetch specializations for filtering
        const specializationsResponse = await fetch('/api/research/specializations');
        if (specializationsResponse.ok) {
          const specializationsData = await specializationsResponse.json();
          if (specializationsData.success) {
            setSpecializations(specializationsData.specializations);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load research contributions');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [selectedTags, selectedStatus]);
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };
  
  const handleCreateContribution = () => {
    if (isAuthenticated) {
      router.push('/research/contribute');
    } else {
      router.push('/login?redirect=/research/contribute');
    }
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Function to navigate to a user's profile page
  const handleProfileClick = (e: React.MouseEvent, fid: number) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/profile/${fid}`);
  };
  
  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Research Contributions</h1>
              <p className="text-gray-600">Discover and collaborate on medical research</p>
            </div>
            
            <button
              onClick={handleCreateContribution}
              className="mt-4 md:mt-0 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Submit Research
            </button>
          </div>
          
          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Filter Research</h2>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Specialization Areas</h3>
              <div className="flex flex-wrap gap-2">
                {specializations.map((specialization) => (
                  <button
                    key={specialization.id}
                    onClick={() => handleTagToggle(specialization.name)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTags.includes(specialization.name)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {specialization.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange('')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedStatus === ''
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleStatusChange('published')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedStatus === 'published'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Published
                </button>
                <button
                  onClick={() => handleStatusChange('peer_reviewed')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedStatus === 'peer_reviewed'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Peer Reviewed
                </button>
                <button
                  onClick={() => handleStatusChange('verified')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedStatus === 'verified'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Verified
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
            <p>{error}</p>
          </div>
        ) : contributions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contributions.map((contribution) => (
              <Link
                key={contribution.id}
                href={`/research/contributions/${contribution.id}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-1">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex space-x-2">
                      {contribution.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs flex items-center justify-center text-center">
                          {tag}
                        </span>
                      ))}
                      {contribution.tags.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          +{contribution.tags.length - 2}
                        </span>
                      )}
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      contribution.status === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : contribution.status === 'peer_reviewed' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {contribution.status.charAt(0).toUpperCase() + contribution.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{contribution.title}</h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">{contribution.abstract}</p>
                  
                  <div className="text-sm text-gray-500 flex items-center">
                    <span>By </span>
                    <button 
                      onClick={(e) => handleProfileClick(e, contribution.authorFid)}
                      className="ml-1 text-purple-600 hover:text-purple-800 hover:underline"
                    >
                      {contribution.authorName || `User ${contribution.authorFid}`}
                    </button>
                    <span className="mx-1">•</span>
                    <span>{formatDate(contribution.timestamp)}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-5 py-3 text-sm text-gray-600 border-t">
                  {contribution.peerReviews ? (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{contribution.peerReviews.length} review{contribution.peerReviews.length !== 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>No reviews yet</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No research contributions found</h3>
            <p className="text-gray-600 mb-4">
              {selectedTags.length > 0 || selectedStatus
                ? 'Try adjusting your filters to see more results'
                : 'Be the first to contribute research to this platform'}
            </p>
            <button
              onClick={handleCreateContribution}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Submit Research
            </button>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { ResearchContribution, ResearchReview } from '@/types/desci';

interface ResearchContributionDetailProps {
  contributionId: string;
}

export default function ResearchContributionDetail({ contributionId }: ResearchContributionDetailProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  
  const [contribution, setContribution] = useState<ResearchContribution | null>(null);
  const [reviews, setReviews] = useState<ResearchReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [isNominating, setIsNominating] = useState(false);
  
  // Function to navigate to a user's profile
  const handleViewProfile = (fid: number) => {
    router.push(`/profile/${fid}`);
  };
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        
        // Fetch contribution
        const contributionResponse = await fetch(`/api/research/contributions/${contributionId}`);
        if (!contributionResponse.ok) {
          throw new Error('Failed to fetch contribution');
        }
        
        const contributionData = await contributionResponse.json();
        if (!contributionData.success) {
          throw new Error(contributionData.error || 'Failed to fetch contribution');
        }
        
        setContribution(contributionData.contribution);
        
        // Fetch reviews
        const reviewsResponse = await fetch(`/api/research/contributions/${contributionId}/reviews`);
        if (!reviewsResponse.ok) {
          throw new Error('Failed to fetch reviews');
        }
        
        const reviewsData = await reviewsResponse.json();
        if (!reviewsData.success) {
          throw new Error(reviewsData.error || 'Failed to fetch reviews');
        }
        
        setReviews(reviewsData.reviews);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load contribution data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [contributionId]);
  
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setReviewError('You must be logged in to submit a review');
      return;
    }
    
    if (!reviewContent) {
      setReviewError('Review content is required');
      return;
    }
    
    setIsSubmittingReview(true);
    setReviewError('');
    
    try {
      const response = await fetch(`/api/research/contributions/${contributionId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewerFid: user.fid,
          reviewerName: user.displayName || user.username,
          content: reviewContent,
          rating: reviewRating
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the new review to the list
        setReviews(prevReviews => [data.review, ...prevReviews]);
        
        // Reset form
        setReviewContent('');
        setReviewRating(5);
      } else {
        setReviewError(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setReviewError('An error occurred while submitting your review');
    } finally {
      setIsSubmittingReview(false);
    }
  };
  
  const handleVoteOnReview = async (reviewId: string, value: 1 | -1) => {
    if (!isAuthenticated || !user) {
      alert('You must be logged in to vote');
      return;
    }
    
    try {
      const response = await fetch(`/api/research/contributions/${contributionId}/reviews`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewId,
          voterFid: user.fid,
          value
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the review in the list
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review.id === reviewId ? data.review : review
          )
        );
      } else {
        alert(data.error || 'Failed to vote on review');
      }
    } catch (error) {
      console.error('Error voting on review:', error);
      alert('An error occurred while voting');
    }
  };
  
  const handleNominate = async () => {
    if (!isAuthenticated || !user || !contribution) {
      alert('You must be logged in to nominate');
      return;
    }
    
    setIsNominating(true);
    
    try {
      const response = await fetch(`/api/research/contributions/${contributionId}/nominate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nominatorFid: user.fid,
          category: contribution.tags[0] || 'research'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Contribution nominated successfully!');
      } else {
        alert(data.error || 'Failed to nominate contribution');
      }
    } catch (error) {
      console.error('Error nominating contribution:', error);
      alert('An error occurred while nominating');
    } finally {
      setIsNominating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error || !contribution) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
          <p>{error || 'Contribution not found'}</p>
        </div>
        <div>
          <Link href="/research" className="text-purple-600 hover:text-purple-800">
            &larr; Back to Research
          </Link>
        </div>
      </div>
    );
  }
  
  // Calculate votes on reviews
  const calculateVotes = (review: ResearchReview) => {
    return review.votes.reduce((sum, vote) => sum + vote.value, 0);
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Check if current user has already reviewed
  const hasUserReviewed = user ? reviews.some(review => review.reviewerFid === user.fid) : false;
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Contribution Header */}
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <Link href="/research" className="text-purple-600 hover:text-purple-800 mr-4">
            &larr; Back to Research
          </Link>
          
          <div className="flex-1"></div>
          
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            contribution.status === 'verified' 
              ? 'bg-green-100 text-green-800' 
              : contribution.status === 'peer_reviewed' 
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
          }`}>
            {contribution.status.charAt(0).toUpperCase() + contribution.status.slice(1).replace('_', ' ')}
          </div>
          
          {/* Verification Badge if verified */}
          {contribution.verificationProof && (
            <div className="ml-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Blockchain Verified
            </div>
          )}
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{contribution.title}</h1>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {contribution.tags.map((tag) => (
            <span key={tag} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
        
        {/* Author & Date */}
        <div className="flex items-center text-gray-600 mb-4">
          <span>By </span>
          <button
            onClick={() => handleViewProfile(contribution.authorFid)}
            className="text-purple-600 hover:text-purple-800 hover:underline ml-1 mr-1"
          >
            {contribution.authorName || `User ${contribution.authorFid}`}
          </button>
          <span className="mx-2">•</span>
          <span>{formatDate(contribution.timestamp)}</span>
        </div>
        
        {/* Collaborators */}
        {contribution.collaborators && contribution.collaborators.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-1">Collaborators:</h3>
            <div className="flex flex-wrap gap-2">
              {contribution.collaborators.map((collaborator, index) => (
                <button
                  key={index}
                  onClick={() => handleViewProfile(collaborator.fid)}
                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm hover:bg-blue-100"
                >
                  {collaborator.name || `User ${collaborator.fid}`} ({collaborator.role})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Abstract */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Abstract</h2>
        <div className="prose max-w-none">
          <p>{contribution.abstract}</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Full Content</h2>
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-200">
            {contribution.content}
          </div>
        </div>
      </div>
      
      {/* Links */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Links & References</h2>
        <div className="bg-white shadow rounded-md divide-y">
          {contribution.links.map((link, index) => (
            <div key={index} className="p-4 flex items-center">
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs uppercase mr-3">
                {link.type}
              </div>
              <div className="flex-1">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                  {link.url}
                </a>
                {link.description && (
                  <p className="text-gray-600 text-sm mt-1">{link.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Nominate Button */}
      <div className="mb-8 flex justify-center">
        <button
          onClick={handleNominate}
          disabled={isNominating || !isAuthenticated}
          className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md shadow-md hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            isNominating || !isAuthenticated ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isNominating ? 'Nominating...' : 'Nominate for Recognition'}
        </button>
      </div>
      
      {/* Reviews */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          Peer Reviews ({reviews.length})
        </h2>
        
        {isAuthenticated && !hasUserReviewed && contribution.authorFid !== user?.fid && (
          <div className="bg-purple-50 p-4 rounded-md mb-6">
            <h3 className="font-medium text-purple-900 mb-3">Submit Your Review</h3>
            
            {reviewError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {reviewError}
              </div>
            )}
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                  Rating *
                </label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-8 w-8 ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                  <span className="ml-2 text-gray-700">{reviewRating} star{reviewRating !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="reviewContent" className="block text-sm font-medium text-gray-700 mb-1">
                  Review Content *
                </label>
                <textarea
                  id="reviewContent"
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmittingReview}
                className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  isSubmittingReview ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        )}
        
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white shadow rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleViewProfile(review.reviewerFid)}
                      className="font-medium text-purple-600 hover:text-purple-800 hover:underline"
                    >
                      {review.reviewerName || `User ${review.reviewerFid}`}
                    </button>
                    <span className="mx-2 text-gray-500">•</span>
                    <div className="text-gray-500 text-sm">
                      {formatDate(review.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i}
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-gray-700 text-sm">{review.rating}/5</span>
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none mb-3">
                  <p>{review.content}</p>
                </div>
                
                {/* Verification Badge if verified */}
                {review.verificationProof && (
                  <div className="mb-3">
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium flex items-center inline-flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  </div>
                )}
                
                {/* Voting */}
                <div className="flex items-center text-gray-500 text-sm">
                  <button
                    onClick={() => handleVoteOnReview(review.id, 1)}
                    disabled={!isAuthenticated}
                    className={`flex items-center mr-3 ${
                      isAuthenticated ? 'hover:text-green-600' : 'opacity-50 cursor-not-allowed'
                    } ${user && review.votes.some(v => v.userId === user.fid && v.value === 1) ? 'text-green-600' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span>{review.votes.filter(v => v.value === 1).length}</span>
                  </button>
                  
                  <button
                    onClick={() => handleVoteOnReview(review.id, -1)}
                    disabled={!isAuthenticated}
                    className={`flex items-center ${
                      isAuthenticated ? 'hover:text-red-600' : 'opacity-50 cursor-not-allowed'
                    } ${user && review.votes.some(v => v.userId === user.fid && v.value === -1) ? 'text-red-600' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                    </svg>
                    <span>{review.votes.filter(v => v.value === -1).length}</span>
                  </button>
                  
                  <span className="ml-4">
                    Score: {calculateVotes(review)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md text-center text-gray-500">
            No reviews yet. Be the first to review this contribution!
          </div>
        )}
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import UserMenu from '@/components/UserMenu';
import ForumIcon from '@/components/ForumIcon';
import ForumCategoryList from '@/components/ForumCategoryList';
import { ForumTopic, ForumCategory } from '@/types/forum';
import { ResearchContribution } from '@/types/desci';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, login } = useUser();
  
  const [trendingTopics, setTrendingTopics] = useState<ForumTopic[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [featuredResearch, setFeaturedResearch] = useState<ResearchContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/forum/categories');
        if (categoriesResponse.ok) {
          const categoryData = await categoriesResponse.json();
          if (categoryData.success) {
            setCategories(categoryData.categories);
          }
        }
        
        // Fetch topics to find trending ones (by view count)
        const topicsResponse = await fetch('/api/forum/topics');
        if (topicsResponse.ok) {
          const topicData = await topicsResponse.json();
          if (topicData.success) {
            // Sort by view count to get trending topics
            const sortedTopics = [...topicData.topics].sort((a, b) => b.viewCount - a.viewCount);
            setTrendingTopics(sortedTopics.slice(0, 5)); // Take top 5 for carousel
          }
        }
        
        // Fetch featured research
        try {
          const researchResponse = await fetch('/api/research/contributions?status=verified');
          if (researchResponse.ok) {
            const researchData = await researchResponse.json();
            if (researchData.success) {
              setFeaturedResearch(researchData.contributions.slice(0, 3));
            }
          }
        } catch (error) {
          console.error('Error fetching research:', error);
          // Don't fail the whole page if research isn't available yet
        }
        
        // Try to sync all content to Farcaster
        try {
          const syncResponse = await fetch('/api/sync/all', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          });
          
          if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            console.log('Farcaster sync result:', syncResult);
          }
        } catch (error) {
          console.error('Error syncing to Farcaster:', error);
          // Don't fail the page load if sync fails
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Set up carousel rotation in a separate useEffect
  useEffect(() => {
    // Only set up the interval if we have topics to display
    if (trendingTopics.length === 0) return;
    
    const interval = setInterval(() => {
      setCarouselIndex((prevIndex) => 
        prevIndex === (trendingTopics.length - 1) ? 0 : prevIndex + 1
      );
    }, 5000);
    
    // Clean up interval on component unmount or when trendingTopics changes
    return () => clearInterval(interval);
  }, [trendingTopics]);
  
  // Effects to update carousel when trending topics load
  useEffect(() => {
    if (trendingTopics.length > 0) {
      setCarouselIndex(0);
    }
  }, [trendingTopics.length]);
  
  const handleCreateTopic = () => {
    if (isAuthenticated) {
      router.push('/create-topic');
    } else {
      // Redirect to login
      router.push('/login?redirect=/create-topic');
    }
  };
  
  // Function to format the date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Carousel navigation
  const goToSlide = (index: number) => {
    setCarouselIndex(index);
  };
  
  const nextSlide = () => {
    setCarouselIndex((prevIndex) => 
      prevIndex === (trendingTopics.length - 1) ? 0 : prevIndex + 1
    );
  };
  
  const prevSlide = () => {
    setCarouselIndex((prevIndex) => 
      prevIndex === 0 ? trendingTopics.length - 1 : prevIndex - 1
    );
  };

  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col px-4 md:px-8 max-w-5xl mx-auto">
        {/* DeSci Platform Banner */}
        <div className="mb-8 bg-gradient-to-r from-purple-700 to-indigo-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 md:p-10 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Decentralized Science Platform
            </h2>
            <p className="text-white/80 text-lg mb-6 max-w-2xl">
              Collaborate on medical research, build your reputation, and earn rewards for your contributions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/research"
                className="px-5 py-3 bg-white text-purple-700 font-medium rounded-md hover:bg-gray-100 transition-colors"
              >
                Explore Research
              </Link>
              <Link
                href="/research/contribute"
                className="px-5 py-3 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors border border-purple-500"
              >
                Contribute Research
              </Link>
            </div>
          </div>
        </div>
        
        {/* Featured Research */}
        {featuredResearch.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Featured Research</h2>
              <Link
                href="/research"
                className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center"
              >
                View All
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredResearch.map((contribution) => (
                <Link
                  key={contribution.id}
                  href={`/research/contributions/${contribution.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 flex flex-col"
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified Research
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 line-clamp-2">{contribution.title}</h3>
                  
                  <p className="text-gray-600 mb-3 text-sm line-clamp-3">{contribution.abstract}</p>
                  
                  <div className="mt-auto text-xs text-gray-500 flex items-center justify-between">
                    <span>{contribution.authorName || `User ${contribution.authorFid}`}</span>
                    <span>{formatDate(contribution.timestamp)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Trending Topics Carousel */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Trending Discussions</h2>
          
          {loading ? (
            <div className="bg-white rounded-lg shadow h-48 w-full animate-pulse">
              <div className="h-full flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ) : trendingTopics.length > 0 ? (
            <div className="relative bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-[3/1] md:aspect-[4/1] relative">
                {trendingTopics.map((topic, index) => (
                  <div 
                    key={topic.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === carouselIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <Link href={`/topic/${topic.id}`} className="block h-full">
                      <div className="h-full p-6 md:p-8 flex flex-col justify-between bg-gradient-to-r from-purple-900 to-purple-700 text-white">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            {topic.isPinned && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-200 text-purple-800">
                                Pinned
                              </span>
                            )}
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-200 text-purple-800">
                              {categories.find(c => c.id === topic.categoryId)?.name || 'Category'}
                            </span>
                          </div>
                          <h3 className="text-xl md:text-2xl font-bold mb-2">{topic.title}</h3>
                          <p className="text-white/80 line-clamp-2">{topic.content}</p>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                          <span>Posted by {topic.authorName || `User ${topic.authorFid}`}</span>
                          <span className="mx-1">•</span>
                          <span>{formatDate(topic.timestamp)}</span>
                          <span className="mx-1">•</span>
                          <span>{topic.viewCount} views</span>
                          <span className="mx-1">•</span>
                          <span>{topic.replyCount} replies</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
              
              {/* Carousel Navigation */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2 z-20">
                {trendingTopics.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      index === carouselIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              
              {/* Prev/Next Buttons */}
              <button 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full z-20"
                onClick={prevSlide}
                aria-label="Previous slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full z-20"
                onClick={nextSlide}
                aria-label="Next slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600">No trending topics available yet.</p>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Start Collaborating</h2>
            <button
              onClick={handleCreateTopic}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create New Topic
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/#forum-categories" 
              className="bg-white p-4 rounded-lg shadow border border-purple-200 hover:shadow-md transition-shadow flex items-center"
            >
              <div className="bg-purple-100 text-purple-700 p-3 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Browse Forum</h3>
                <p className="text-sm text-gray-600">Explore all discussions</p>
              </div>
            </Link>
            
            <Link 
              href="/research" 
              className="bg-white p-4 rounded-lg shadow border border-purple-200 hover:shadow-md transition-shadow flex items-center"
            >
              <div className="bg-indigo-100 text-indigo-700 p-3 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Research Hub</h3>
                <p className="text-sm text-gray-600">Discover medical research</p>
              </div>
            </Link>
            
            <Link 
              href={isAuthenticated ? `/profile/${user?.fid}` : '/login'} 
              className="bg-white p-4 rounded-lg shadow border border-purple-200 hover:shadow-md transition-shadow flex items-center"
            >
              <div className="bg-green-100 text-green-700 p-3 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Reputation</h3>
                <p className="text-sm text-gray-600">Build your scientific credibility</p>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Forum Categories */}
        <div id="forum-categories" className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Forum Categories</h2>
          <ForumCategoryList categories={categories} loading={loading} />
        </div>
        
        {/* DeSci Benefits */}
        <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Benefits of DeSci Platform</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-purple-100 text-purple-700 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Build Reputation</h3>
                <p className="text-gray-600">Earn verifiable credentials and reputation scores based on your contributions.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 text-blue-700 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Earn Rewards</h3>
                <p className="text-gray-600">Get tokens for valuable contributions, reviews, and community participation.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 text-green-700 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Collaborate</h3>
                <p className="text-gray-600">Connect with researchers and practitioners across disciplines globally.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

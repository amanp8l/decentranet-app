'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { UserReputation } from '@/types/desci';

interface UserReputationDisplayProps {
  fid?: number; // Optional FID, will use logged in user if not provided
}

export default function UserReputationDisplay({ fid }: UserReputationDisplayProps) {
  const { user, isAuthenticated } = useUser();
  
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // User to display - either the provided FID or the logged in user
  const displayFid = fid || (user?.fid ?? null);
  
  // Verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationType, setVerificationType] = useState<'academic' | 'clinical' | 'industry' | 'research'>('academic');
  const [institution, setInstitution] = useState('');
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  
  useEffect(() => {
    async function fetchData() {
      if (!displayFid) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError('');
        
        // Fetch reputation
        const reputationResponse = await fetch(`/api/reputation/${displayFid}`);
        if (reputationResponse.ok) {
          const reputationData = await reputationResponse.json();
          if (reputationData.success) {
            setReputation(reputationData.reputation);
          } else {
            throw new Error(reputationData.error || 'Failed to fetch reputation');
          }
        } else {
          throw new Error('Failed to fetch reputation');
        }
        
        // Fetch token balance
        const tokenResponse = await fetch(`/api/tokens/balance/${displayFid}`);
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          if (tokenData.success) {
            setTokenBalance(tokenData.balance);
          } else {
            throw new Error(tokenData.error || 'Failed to fetch token balance');
          }
        } else {
          throw new Error('Failed to fetch token balance');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load reputation data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [displayFid]);
  
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      setVerificationError('You must be logged in to verify credentials');
      return;
    }
    
    if (!verificationType || !institution) {
      setVerificationError('All fields are required');
      return;
    }
    
    setIsSubmittingVerification(true);
    setVerificationError('');
    
    try {
      const response = await fetch(`/api/reputation/${user.fid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verificationType,
          institution
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update reputation
        setReputation(data.reputation);
        
        // Close modal
        setShowVerificationModal(false);
        
        // Reset form
        setVerificationType('academic');
        setInstitution('');
      } else {
        setVerificationError(data.error || 'Failed to verify credentials');
      }
    } catch (error) {
      console.error('Error verifying credentials:', error);
      setVerificationError('An error occurred during verification');
    } finally {
      setIsSubmittingVerification(false);
    }
  };
  
  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center h-40">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!reputation) {
    return (
      <div className="w-full bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No reputation data available</p>
        {isAuthenticated && user && !fid && (
          <button
            onClick={() => setShowVerificationModal(true)}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Verify Your Credentials
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className="w-full bg-white rounded-lg shadow overflow-hidden">
      {/* Reputation Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Research Reputation</h2>
          
          {/* Show verification button if viewing own profile */}
          {isAuthenticated && user && user.fid === reputation.fid && (
            <button
              onClick={() => setShowVerificationModal(true)}
              className="px-3 py-1 bg-white text-purple-700 rounded text-sm font-medium hover:bg-gray-100"
            >
              Verify Credentials
            </button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between">
          <div>
            <div className="text-lg text-white/80">Reputation Score</div>
            <div className="text-4xl font-bold">
              {reputation.reputationScore}
            </div>
          </div>
          
          {tokenBalance !== null && (
            <div className="mt-4 md:mt-0">
              <div className="text-lg text-white/80">Token Balance</div>
              <div className="text-3xl font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {tokenBalance}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Reputation Details */}
      <div className="p-6">
        {/* Specializations */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Specializations</h3>
          
          {reputation.specializations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reputation.specializations.map((specialization, index) => (
                <div key={index} className="bg-gray-50 rounded-md p-3 flex justify-between items-center">
                  <span className="font-medium">{specialization.field}</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                    {specialization.score} pts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No specializations yet</p>
          )}
        </div>
        
        {/* Badges */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Badges</h3>
          
          {reputation.badges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {reputation.badges.map((badge) => (
                <div key={badge.id} className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-md p-4 border border-amber-200">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h4 className="font-bold text-amber-900">{badge.name}</h4>
                  </div>
                  <p className="text-sm text-amber-800">{badge.description}</p>
                  <div className="mt-2 text-xs text-amber-700">
                    Awarded {new Date(badge.awardedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No badges earned yet</p>
          )}
        </div>
        
        {/* Verifications */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Verified Credentials</h3>
          
          {reputation.verifications.length > 0 ? (
            <div className="space-y-3">
              {reputation.verifications.map((verification, index) => (
                <div key={index} className="bg-green-50 rounded-md p-3 border border-green-200">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <div className="font-medium text-green-800">
                        {verification.type.charAt(0).toUpperCase() + verification.type.slice(1)} Verification
                      </div>
                      {verification.institution && (
                        <div className="text-sm text-green-700">
                          {verification.institution}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-green-700">
                      {new Date(verification.verifiedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No verified credentials yet</p>
          )}
        </div>
        
        {/* Contribution Stats */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Contribution Stats</h3>
          
          {reputation.contributions.length > 0 ? (
            <div className="bg-gray-50 rounded-md p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {reputation.contributions.map((contribution, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-gray-800">{contribution.count}</div>
                    <div className="text-sm text-gray-600">
                      {contribution.type.charAt(0).toUpperCase() + contribution.type.slice(1)}s
                    </div>
                    <div className="text-xs text-purple-600 font-medium">
                      {contribution.score} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No contributions yet</p>
          )}
        </div>
      </div>
      
      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Verify Your Credentials</h3>
                <button 
                  onClick={() => setShowVerificationModal(false)} 
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {verificationError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {verificationError}
                </div>
              )}
              
              <form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div>
                  <label htmlFor="verificationType" className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Type *
                  </label>
                  <select
                    id="verificationType"
                    value={verificationType}
                    onChange={(e) => setVerificationType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="academic">Academic</option>
                    <option value="clinical">Clinical</option>
                    <option value="industry">Industry</option>
                    <option value="research">Research</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
                    Institution/Organization *
                  </label>
                  <input
                    type="text"
                    id="institution"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowVerificationModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingVerification}
                    className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isSubmittingVerification ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmittingVerification ? 'Verifying...' : 'Submit for Verification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import CastFeed from '@/components/CastFeed';
import CastForm from '@/components/CastForm';
import LoginOptions from '@/components/LoginOptions';
import UserProfile from '@/components/UserProfile';
import { useUser } from '@/context/UserContext';

export default function Home() {
  const { user, isAuthenticated, login } = useUser();
  const [viewingProfile, setViewingProfile] = useState<number | null>(null);
  
  useEffect(() => {
    // Check URL parameters on mount for profile viewing
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const profileId = urlParams.get('profile');
      
      if (profileId) {
        const fid = parseInt(profileId);
        if (!isNaN(fid)) {
          setViewingProfile(fid);
        }
      }
    }
  }, []);
  
  const handleViewProfile = (fid: number) => {
    setViewingProfile(fid);
    
    // Update the URL to include the profile being viewed
    const url = new URL(window.location.href);
    url.searchParams.set('profile', fid.toString());
    window.history.pushState({}, '', url.toString());
  };

  const handleBackToFeed = () => {
    setViewingProfile(null);
    
    // Remove the profile parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('profile');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8 max-w-3xl mx-auto">
      {/* App Title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">DecentraNet</h1>
        <p className="text-gray-600">The DeSci-centric SocialFi platform for verified expertise</p>
      </div>
      
      {/* Login Section - Only show when user is not logged in */}
      {!isAuthenticated && (
        <div className="mb-6">
          <LoginOptions onLogin={login} />
        </div>
      )}
      
      {/* Main Content */}
      <div className="space-y-6">
        {/* Compose Cast Form - Only show when user is logged in and not viewing a profile */}
        {user && !viewingProfile && <CastForm />}
        
        {/* User Profile or Cast Feed */}
        {viewingProfile ? (
          <UserProfile 
            fid={viewingProfile} 
            onBack={handleBackToFeed}
            onViewProfile={handleViewProfile}
          />
        ) : (
          <CastFeed onViewProfile={handleViewProfile} />
        )}
      </div>
    </main>
  );
}

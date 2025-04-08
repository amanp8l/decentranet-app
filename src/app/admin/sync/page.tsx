'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FarcasterSyncPanel from '@/components/FarcasterSyncPanel';

export default function AdminSyncPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if user is admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      router.push('/');
    }
    
    if (isAuthenticated !== undefined) {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, router, isLoading]);
  
  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </main>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col px-4 py-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Control Panel</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Farcaster Integration</h2>
          <FarcasterSyncPanel />
        </div>
        
        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Sync Information</h2>
          <div className="bg-white shadow-md rounded-lg p-6">
            <p className="mb-3">
              The Farcaster integration allows content from the DeSci platform to be synchronized with the 
              Farcaster social protocol. This enables wider distribution of research findings, forum discussions,
              and other platform activities.
            </p>
            
            <h3 className="font-medium text-lg mt-4 mb-2">Sync Types</h3>
            <ul className="list-disc pl-5 mb-4">
              <li><strong>All Content</strong> - Syncs everything to Farcaster</li>
              <li><strong>Casts</strong> - Syncs user casts and messages</li>
              <li><strong>Topics</strong> - Syncs forum topics as casts</li>
              <li><strong>Research</strong> - Syncs research contributions as casts</li>
              <li><strong>Votes</strong> - Syncs votes/reactions on content</li>
              <li><strong>Follows</strong> - Syncs user follows between platforms</li>
            </ul>
            
            <p className="text-sm text-gray-500">
              Note: Syncing requires a running Farcaster Hubble node accessible at 
              the URL configured in the environment variables.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
} 
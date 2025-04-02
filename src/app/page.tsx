'use client';

import { useState } from 'react';
import CastFeed from '@/components/CastFeed';
import CastForm from '@/components/CastForm';
import LoginOptions from '@/components/LoginOptions';
import UserProfile from '@/components/UserProfile';
import { useUser } from '@/context/UserContext';

export default function Home() {
  const { isAuthenticated, login } = useUser();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="bg-white shadow-sm rounded-lg p-4 mb-6 flex items-center">
          <div className="bg-purple-600 w-10 h-10 rounded-md flex items-center justify-center text-white mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Farcaster Social UI</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            {isAuthenticated ? (
              <>
                <UserProfile />
                <div className="mt-6">
                  <CastForm />
                </div>
              </>
            ) : (
              <LoginOptions onLogin={login} />
            )}
            
            <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-4">About</h2>
              <p className="text-gray-600">
                This is a decentralized app that connects to your local Hubble node 
                to interact with the Farcaster network.
              </p>
              <p className="text-gray-600 mt-2">
                Your node is running at:
              </p>
              <div className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                <code className="text-sm">http://localhost:2281</code>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <CastFeed />
          </div>
        </div>
      </div>
    </main>
  );
}

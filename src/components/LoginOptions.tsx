'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createWalletClient, custom, http } from 'viem';

interface LoginProps {
  onLogin: (provider: string, address?: string) => void;
}

export default function LoginOptions({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if user is on mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent;
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent));
    }
  }, []);

  // Check URL parameters on mount for auth flow completion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const authStatus = urlParams.get('auth');
      const nonce = urlParams.get('nonce');
      
      if (authStatus === 'success' && nonce) {
        completeAuthentication(nonce);
      } else if (authStatus === 'error') {
        const reason = urlParams.get('reason') || 'unknown';
        setStatusMessage(`Authentication failed: ${reason}. Please try again.`);
      }
      
      // Clean up URL parameters
      if (authStatus) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  // Function to initiate Warpcast authentication
  const startWarpcastLogin = async () => {
    setIsLoading(true);
    setStatusMessage("Preparing authentication...");
    
    try {
      // Step 1: Get authentication parameters from server
      const response = await fetch('/api/auth/nonce', { method: 'GET' });
      
      if (!response.ok) {
        throw new Error("Failed to initialize authentication");
      }
      
      const data = await response.json();
      console.log('Nonce response:', data);
      
      if (!data.success || !data.nonce || !data.messageJson) {
        throw new Error("Invalid response from server");
      }
      
      const { nonce, messageJson } = data;
      
      // Store the nonce in session storage for later retrieval
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('warpcast_auth_nonce', nonce);
      }
      
      // Build the callback URL properly
      const callbackUrl = new URL('/api/auth/callback', window.location.origin);
      callbackUrl.searchParams.append('nonce', nonce);
      
      // Create the Warpcast sign URL with properly encoded parameters
      const warpcastUrl = new URL('https://warpcast.com/~/sign');
      warpcastUrl.searchParams.append('message', messageJson);
      warpcastUrl.searchParams.append('redirect', 'true');
      warpcastUrl.searchParams.append('r', callbackUrl.toString());
      
      console.log('Warpcast URL:', warpcastUrl.toString());
      setAuthUrl(warpcastUrl.toString());
      
      // Create deep link for mobile app
      const deepLink = new URL('farcaster://warpcast.com/~/sign');
      deepLink.searchParams.append('message', messageJson);
      deepLink.searchParams.append('redirect', 'true');
      deepLink.searchParams.append('r', callbackUrl.toString());
      
      // Generate QR code for scanning
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(deepLink.toString())}&color=5624d0`;
      setQrCode(qrCodeUrl);
      
      // Update status message
      setStatusMessage(isMobile ? "Tap the button to open Warpcast" : "Scan this QR code with your Warpcast app");
      
      // Start polling for authentication status
      startPolling(nonce);
    } catch (error) {
      console.error("Warpcast authentication error:", error);
      setStatusMessage(`Authentication setup failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start polling for authentication status
  const startPolling = (nonce: string) => {
    // Clear any existing intervals
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/auth/status?nonce=${nonce}`);
        
        if (!response.ok) {
          throw new Error("Failed to check authentication status");
        }
        
        const data = await response.json();
        
        if (data.status === 'completed') {
          clearInterval(interval);
          completeAuthentication(nonce);
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
      }
    }, 2000);
    
    setPollingInterval(interval);
  };
  
  // Complete the authentication and login
  const completeAuthentication = async (nonce: string) => {
    setStatusMessage("Authentication successful! Logging you in...");
    
    try {
      // Try to complete with the nonce-based authentication
      const response = await fetch('/api/auth/farcaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonce })
      });
      
      if (!response.ok) {
        throw new Error("Failed to complete authentication");
      }
      
      // Cleanup
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      
      // Login success
      setTimeout(() => onLogin('farcaster'), 500);
    } catch (error) {
      console.error("Error completing authentication:", error);
      setStatusMessage("Authentication error. Trying demo account...");
      
      // Fallback to demo account
      try {
        const demoResponse = await fetch('/api/auth/farcaster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ useDemoAccount: true })
        });
        
        if (demoResponse.ok) {
          // Cleanup
          if (pollingInterval) {
            clearInterval(pollingInterval);
          }
          
          // Login with demo account
          setTimeout(() => onLogin('farcaster'), 500);
        } else {
          throw new Error("Failed to use demo account");
        }
      } catch (demoError) {
        console.error("Even demo auth failed:", demoError);
        setStatusMessage("Authentication failed completely. Please try again.");
      }
    }
  };
  
  // Reset authentication state
  const resetAuth = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    setPollingInterval(null);
    setQrCode(null);
    setAuthUrl(null);
    setStatusMessage(null);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Add a button for local development testing that manually completes the auth
  const debugLocalAuth = async (nonce: string) => {
    console.log("Debug: Manually completing auth for nonce", nonce);
    setStatusMessage("DEBUG: Manually completing auth...");
    
    try {
      // Create a mock signature with FID 2 for testing
      const mockData = {
        nonce: nonce,
        fid: 2, // Use test FID
        signature: 'debug_signature',
        message: JSON.stringify({ nonce })
      };
      
      console.log("Debug: Sending mock data to callback:", mockData);
      
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockData),
      });
      
      const responseText = await response.text();
      
      if (response.ok) {
        console.log("Debug: Manual auth callback successful:", responseText);
        setStatusMessage("DEBUG: Callback successful, completing login...");
        
        // Wait a moment to ensure the status is updated
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Complete the authentication with the nonce
        completeAuthentication(nonce);
      } else {
        console.error("Debug: Manual auth failed", responseText);
        setStatusMessage("DEBUG: Auth failed! Check console.");
      }
    } catch (error) {
      console.error("Debug: Error in manual auth", error);
      setStatusMessage("DEBUG: Error in manual auth! Check console.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Connect to Farcaster</h2>
      <p className="text-gray-600 mb-6">
        {isMobile 
          ? "Tap the button below to open Warpcast and login"
          : "Scan the QR code with your Warpcast app to login with your Farcaster account"
        }
      </p>
      
      {qrCode ? (
        <div className="flex flex-col items-center mb-6">
          {statusMessage && (
            <p className="text-sm text-gray-700 mb-3">{statusMessage}</p>
          )}
          
          {!isMobile && (
            <div className="w-64 h-64 bg-gray-100 flex items-center justify-center border border-gray-300">
              <Image 
                src={qrCode} 
                alt="Warpcast Login QR Code"
                width={250}
                height={250}
                unoptimized={true}
              />
            </div>
          )}
          
          <div className="flex flex-col space-y-2 mt-4">
            <a 
              href={authUrl || '#'} 
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
              </svg>
              Sign in with Warpcast
            </a>
            
            <button
              onClick={() => {
                if (authUrl) {
                  window.location.href = authUrl;
                }
              }}
              className="mt-2 text-purple-600 hover:text-purple-800 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Open in this window instead
            </button>
            
            {qrCode && process.env.NODE_ENV !== 'production' && (
              <button
                onClick={() => {
                  const storedNonce = sessionStorage.getItem('warpcast_auth_nonce');
                  if (storedNonce) {
                    debugLocalAuth(storedNonce);
                  }
                }}
                className="mt-2 text-red-600 hover:text-red-800 flex items-center justify-center border border-red-300 px-2 py-1 rounded-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Debug: Complete Auth (Local Dev Only)
              </button>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-2">Having trouble connecting?</p>
            <button
              onClick={() => {
                // Use demo login as fallback
                fetch('/api/auth/farcaster', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ useDemoAccount: true }),
                })
                .then(response => {
                  if (response.ok) {
                    onLogin('farcaster');
                  }
                });
              }}
              className="text-purple-600 text-sm hover:underline"
            >
              Use demo account instead
            </button>
          </div>
          
          <button
            onClick={resetAuth}
            className="mt-4 text-purple-600 hover:text-purple-800 text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={startWarpcastLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center">
              <div className="bg-purple-600 w-8 h-8 rounded-md flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <div>
                <span className="font-medium">Warpcast App</span>
                <p className="text-xs text-gray-500">Connect with your Farcaster account</p>
              </div>
            </div>
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-600"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </button>
        </div>
      )}
      
      {statusMessage && statusMessage.includes("failed") && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {statusMessage}
          <button
            onClick={resetAuth}
            className="ml-2 text-red-700 hover:text-red-900 underline"
          >
            Try again
          </button>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <a href="https://docs.farcaster.xyz/auth-kit/warpcast-auth" target="_blank" rel="noopener noreferrer" className="text-purple-600 text-sm hover:underline">
          Learn more about Warpcast Login
        </a>
      </div>
    </div>
  );
} 
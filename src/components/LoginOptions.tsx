'use client';

import { useState } from 'react';
import Image from 'next/image';

interface LoginProps {
  onLogin: (provider: string, address?: string) => void;
}

export default function LoginOptions({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [showWalletInput, setShowWalletInput] = useState(false);

  const handleLogin = async (provider: string) => {
    setIsLoading(true);
    setSelectedProvider(provider);
    
    try {
      if (provider === 'farcaster') {
        // Show a QR code for Farcaster app login simulation
        setQrCode('/qr-placeholder.png');
        // In a real implementation, this would generate a signer message and QR code
        
        // Simulate waiting for response from Farcaster app
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Hide QR code after simulated login
        setQrCode(null);
        onLogin(provider);
      } 
      else if (provider === 'wallet') {
        // Show wallet input field
        setShowWalletInput(true);
        setIsLoading(false);
        return; // Stop here until user submits wallet address
      } 
      else if (provider === 'hubble') {
        // For Hubble, make an actual request to the API
        onLogin(provider);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      if (provider !== 'wallet' || !showWalletInput) {
        setIsLoading(false);
        setSelectedProvider(null);
      }
    }
  };

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress.trim()) {
      alert('Please enter a valid Ethereum address');
      return;
    }
    
    // Validate address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      alert('Please enter a valid Ethereum address (0x followed by 40 hex characters)');
      return;
    }
    
    // Simulating wallet connection and verification
    setIsLoading(true);
    
    // Pass the wallet address to the login function
    onLogin('wallet', walletAddress);
    
    // Reset state after a brief delay
    setTimeout(() => {
      setShowWalletInput(false);
      setIsLoading(false);
      setSelectedProvider(null);
    }, 1500);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4">Connect to Farcaster</h2>
      <p className="text-gray-600 mb-6">
        Choose an authentication method to interact with the Farcaster network
      </p>
      
      {qrCode ? (
        <div className="flex flex-col items-center mb-6">
          <p className="text-sm text-gray-700 mb-3">Scan this QR code with your Farcaster mobile app</p>
          <div className="w-64 h-64 bg-gray-100 flex items-center justify-center border border-gray-300">
            <p className="text-gray-500">QR Code Placeholder</p>
          </div>
          <p className="text-xs text-gray-500 mt-3">The QR code will expire in 5 minutes</p>
        </div>
      ) : showWalletInput ? (
        <form onSubmit={handleWalletSubmit} className="mb-6">
          <p className="text-sm text-gray-700 mb-3">Enter your Ethereum wallet address</p>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-2 border border-gray-300 rounded mb-3"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setShowWalletInput(false);
                setWalletAddress('');
                setSelectedProvider(null);
              }}
              className="text-gray-500 text-sm"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => handleLogin('farcaster')}
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
                <p className="text-xs text-gray-500">Connect with the Farcaster mobile app</p>
              </div>
            </div>
            {isLoading && selectedProvider === 'farcaster' ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-600"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </button>
          
          <button
            onClick={() => handleLogin('wallet')}
            disabled={isLoading}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center">
              <div className="bg-blue-500 w-8 h-8 rounded-md flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                </svg>
              </div>
              <div>
                <span className="font-medium">Ethereum Wallet</span>
                <p className="text-xs text-gray-500">Connect with MetaMask or other wallets</p>
              </div>
            </div>
            {isLoading && selectedProvider === 'wallet' ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </button>
          
          <button
            onClick={() => handleLogin('hubble')}
            disabled={isLoading}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center">
              <div className="bg-green-500 w-8 h-8 rounded-md flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 018.25-3m-8.25 3a4.5 4.5 0 004.5 4.5" />
                </svg>
              </div>
              <div>
                <span className="font-medium">Local Hubble Node</span>
                <p className="text-xs text-gray-500">Connect with your node (FID: 15300)</p>
              </div>
            </div>
            {isLoading && selectedProvider === 'hubble' ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-500"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </button>
        </div>
      )}
      
      <div className="mt-6 text-center">
        <a href="https://docs.farcaster.xyz/learn/what-is-farcaster" target="_blank" rel="noopener noreferrer" className="text-purple-600 text-sm hover:underline">
          Learn more about Farcaster
        </a>
      </div>
    </div>
  );
} 
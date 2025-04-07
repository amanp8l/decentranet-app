'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  displayName?: string;
  fid: number;
  provider: string;
  avatar?: string;
  authToken?: string;
  followers?: number;
  following?: number;
  bio?: string;
  verifications?: any[];
  walletData?: {
    address: string;
    chainId: number;
    ensName?: string | null;
    walletType?: 'metamask' | 'generic' | string;
  };
  signedMessage?: {
    domain: string;
    address: string;
    chainId: number;
    issuedAt: string;
    expirationTime: string;
  };
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (provider: string, address?: string, email?: string, password?: string, isRegister?: boolean) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for an existing user session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Only access localStorage in the browser
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('farcaster_user');
          
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            
            // If user was connected with MetaMask, verify they are still connected
            if (parsedUser.provider === 'wallet' && parsedUser.walletData?.address) {
              // Check if MetaMask is available and still has access
              if (window.ethereum) {
                try {
                  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                  // If no accounts or different account, don't restore the session
                  if (!accounts || accounts.length === 0 || accounts[0].toLowerCase() !== parsedUser.walletData.address.toLowerCase()) {
                    localStorage.removeItem('farcaster_user');
                    return;
                  }
                } catch (err) {
                  console.error('Error checking MetaMask connection:', err);
                  localStorage.removeItem('farcaster_user');
                  return;
                }
              } else {
                // MetaMask no longer available
                localStorage.removeItem('farcaster_user');
                return;
              }
            }
            
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error('Error checking for existing session:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('farcaster_user');
        }
      }
    };
    
    checkExistingSession();
  }, []);

  const login = async (provider: string, address?: string, email?: string, password?: string, isRegister?: boolean) => {
    setIsLoading(true);
    
    try {
      let userData: User | null = null;
      
      if (provider === 'hubble') {
        // Connect to local Hubble node
        const response = await fetch('/api/auth/hubble', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to authenticate with Hubble node');
        }
        
        const data = await response.json();
        
        if (data.success) {
          userData = {
            id: data.user.id,
            username: data.user.username,
            displayName: data.user.displayName,
            fid: data.user.fid,
            provider: 'hubble',
            avatar: data.user.pfp || undefined,
            bio: data.user.bio,
            authToken: data.user.authToken
          };
        }
      } else if (provider === 'farcaster') {
        // Authenticate with Farcaster app
        const response = await fetch('/api/auth/farcaster', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to authenticate with Farcaster');
        }
        
        const data = await response.json();
        
        if (data.success) {
          userData = {
            id: data.user.id,
            username: data.user.username,
            displayName: data.user.displayName,
            fid: data.user.fid,
            provider: 'farcaster',
            avatar: data.user.pfp || undefined,
            bio: data.user.bio,
            followers: data.user.followers,
            following: data.user.following,
            verifications: data.user.verifications,
            authToken: data.user.authToken
          };
        }
      } else if (provider === 'wallet') {
        // Authenticate with wallet
        const requestBody: any = {};
        if (address) {
          requestBody.address = address;
          
          // Check if this is a MetaMask connection
          if (typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask) {
            requestBody.walletType = 'metamask';
            requestBody.isMetaMask = true;
          } else {
            requestBody.walletType = 'generic';
          }
        }
        
        const response = await fetch('/api/auth/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          throw new Error('Failed to authenticate with wallet');
        }
        
        const data = await response.json();
        
        if (data.success) {
          userData = {
            id: data.user.id,
            username: data.user.username,
            displayName: data.user.displayName,
            fid: data.user.fid,
            provider: 'wallet',
            avatar: data.user.pfp || undefined,
            bio: data.user.bio,
            followers: data.user.followers,
            following: data.user.following,
            verifications: data.user.verifications,
            authToken: data.user.authToken,
            walletData: data.user.walletData,
            signedMessage: data.user.signedMessage
          };
        }
      } else if (provider === 'email') {
        // Authenticate with email/password
        if (!email || !password) {
          throw new Error('Email and password are required');
        }
        
        const response = await fetch('/api/auth/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            action: isRegister ? 'register' : 'login'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to authenticate with email/password');
        }
        
        const data = await response.json();
        
        if (data.success) {
          userData = {
            id: data.user.id,
            username: data.user.username,
            displayName: data.user.displayName,
            fid: data.user.fid,
            provider: 'email',
            avatar: data.user.pfp || undefined,
            bio: data.user.bio,
            followers: data.user.followers,
            following: data.user.following,
            verifications: data.user.verifications,
            authToken: data.user.authToken
          };
        }
      }
      
      if (userData) {
        setUser(userData);
        // Only save to localStorage in the browser
        if (typeof window !== 'undefined') {
          localStorage.setItem('farcaster_user', JSON.stringify(userData));
        }
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // Only access localStorage in the browser
    if (typeof window !== 'undefined') {
      localStorage.removeItem('farcaster_user');
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 
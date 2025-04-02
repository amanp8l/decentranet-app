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
  login: (provider: string, address?: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    // Only access localStorage in the browser
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('farcaster_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse stored user:', e);
          localStorage.removeItem('farcaster_user');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (provider: string, address?: string) => {
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
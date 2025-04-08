'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define User type
export interface User {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  fid: number;
  provider: string;
  pfp?: string | null;
  following?: number[];
  followers?: number[];
  authToken?: string;
  isAdmin?: boolean;
  stats?: {
    postCount: number;
    commentCount: number;
    receivedUpvotes: number;
    receivedDownvotes: number;
    givenUpvotes: number;
    givenDownvotes: number;
  };
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateFollowingList: (fid: number, isFollowing: boolean) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (provider: string, address?: string, email?: string, password?: string, isRegister?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Try to load user from localStorage on component mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);
  
  useEffect(() => {
    // Save user to localStorage whenever it changes
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);
  
  // Function to update the following list
  const updateFollowingList = (fid: number, isFollowing: boolean) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      
      // Initialize following array if it doesn't exist
      const following = prevUser.following || [];
      
      // Add or remove the FID
      let updatedFollowing;
      if (isFollowing) {
        // Add FID if not already following
        updatedFollowing = following.includes(fid) ? following : [...following, fid];
      } else {
        // Remove FID if currently following
        updatedFollowing = following.filter(id => id !== fid);
      }
      
      return {
        ...prevUser,
        following: updatedFollowing
      };
    });
  };
  
  // Login function
  const login = async (
    provider: string, 
    address?: string, 
    email?: string, 
    password?: string, 
    isRegister?: boolean
  ) => {
    setIsLoading(true);
    
    try {
      let userData: User | null = null;
      
      if (provider === 'email') {
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
            pfp: data.user.pfp || null,
            followers: data.user.followers,
            following: data.user.following,
            stats: data.user.stats,
            authToken: data.user.authToken
          };
        }
      } else if (provider === 'wallet') {
        // Placeholder for wallet authentication
        console.log('Wallet authentication not implemented yet');
      }
      
      if (userData) {
        setUser(userData);
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
  
  // Logout function
  const logout = async () => {
    try {
      // Only call the logout API if we have a user and an auth token
      if (user?.authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.authToken}`
          }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear user state regardless of API success/failure
      setUser(null);
    }
  };
  
  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      updateFollowingList,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 
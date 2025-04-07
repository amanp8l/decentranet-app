import React from 'react';

/**
 * Formats text content by converting URLs to clickable links and @mentions to user profile links
 */
export function formatText(text: string, onViewProfile?: (fid: number) => void): React.ReactNode {
  if (!text) return '';
  
  // Split text by spaces to properly isolate tokens
  const tokens = text.split(/(\s+)/);
  
  // Process each token
  const elements = tokens.map((token, index) => {
    // Check if token is a URL
    if (token.match(/^https?:\/\/\S+/i)) {
      return React.createElement(
        'a',
        {
          key: `url-${index}`,
          href: token,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: 'text-purple-600 hover:text-purple-800 hover:underline'
        },
        token
      );
    }
    
    // Check if token is a mention
    else if (token.match(/^@\w+/i)) {
      const username = token.substring(1);
      
      return React.createElement(
        'button',
        {
          key: `mention-${index}`,
          onClick: () => {
            if (onViewProfile) {
              fetchUserByUsername(username)
                .then(fid => {
                  if (fid && onViewProfile) {
                    onViewProfile(fid);
                  }
                })
                .catch(error => {
                  console.error('Error fetching user FID:', error);
                });
            }
          },
          className: 'text-purple-600 hover:text-purple-800 hover:underline font-medium'
        },
        token
      );
    }
    
    // Regular text
    else {
      return token;
    }
  });
  
  return React.createElement(React.Fragment, null, ...elements);
}

/**
 * Mock function to simulate fetching a user's FID by username
 * In a real app, this would be an API call to get the user by username
 */
async function fetchUserByUsername(username: string): Promise<number | null> {
  try {
    // In a real app, this would be an API call
    const response = await fetch(`/api/users/username/${username}`);
    if (response.ok) {
      const data = await response.json();
      return data.user?.fid || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }
}

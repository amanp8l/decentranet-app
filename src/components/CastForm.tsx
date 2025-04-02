'use client';

import { useState, FormEvent } from 'react';
import { useUser } from '@/context/UserContext';

export default function CastForm() {
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (!user) {
      setError('You must be logged in to post a cast');
      return;
    }

    try {
      setError(null);
      setSubmitting(true);
      setSuccess(false);
      
      // Use the real auth token if available from the user context
      const authToken = user.authToken || user.id;
      
      const response = await fetch('/api/submit-cast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          text: message,
          fid: user.fid,
          // Include any mentions parsed from the message
          mentions: message.match(/@(\w+)/g)?.map(m => m.substring(1)) || []
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setMessage('');
      } else {
        setError(result.error || 'Failed to submit cast');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Show connection details to make it clear we're using real auth
  const connectionInfo = user ? (
    <div className="mb-4 text-xs text-gray-500">
      <div className="flex items-center mb-1">
        <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
        <span>
          Connected as <strong>{user.username}</strong> 
          {user.displayName && user.displayName !== user.username && ` (${user.displayName})`}
        </span>
      </div>
      <div className="text-xs text-gray-400">
        FID: {user.fid} • Auth: {user.provider} • {user.authToken ? "Verified ✓" : "Limited"}
      </div>
    </div>
  ) : null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-2">Post a New Cast</h2>
      
      {connectionInfo}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4">
          Cast submitted successfully!
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={3}
            placeholder="What's on your mind?"
            disabled={submitting}
          />
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{message.length} / 320 characters</span>
            <span>@mentions and links supported</span>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={submitting || !user}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Post Cast'}
        </button>
      </form>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { useUser } from '@/context/UserContext';

export default function SyncPage() {
  const { user } = useUser();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [hubbleUrl, setHubbleUrl] = useState('');
  const [hubbleInfo, setHubbleInfo] = useState<any>(null);
  const [syncType, setSyncType] = useState<'comments' | 'casts' | 'votes' | 'follows'>('comments');
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [allSyncProgress, setAllSyncProgress] = useState({ 
    current: 0, 
    total: 4, 
    results: [] as any[] 
  });
  
  // Check Hubble connection
  const checkHubbleConnection = async () => {
    setStatus('loading');
    setMessage('Checking Hubble connection...');
    
    try {
      const response = await fetch('/api/sync/comments');
      
      if (response.ok) {
        const data = await response.json();
        setHubbleInfo(data);
        
        if (data.hubbleStatus === 'connected') {
          setMessage('Connected to Hubble node');
        } else {
          setMessage(`Hubble node status: ${data.hubbleStatus}`);
        }
      } else {
        setMessage('Failed to check Hubble connection');
      }
    } catch (error) {
      setMessage('Error checking Hubble connection');
      console.error(error);
    } finally {
      setStatus('idle');
    }
  };
  
  // Sync data to Farcaster
  const syncData = async () => {
    if (status === 'loading') return;
    
    setStatus('loading');
    setMessage(`Syncing ${syncType} to Farcaster...`);
    setStats(null);
    
    let endpoint = '';
    switch(syncType) {
      case 'comments':
        endpoint = '/api/sync/comments';
        break;
      case 'casts':
        endpoint = '/api/sync/casts';
        break;
      case 'votes':
        endpoint = '/api/sync/votes';
        break;
      case 'follows':
        endpoint = '/api/sync/follows';
        break;
    }
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hubbleUrl: hubbleUrl || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage(`${syncType.charAt(0).toUpperCase() + syncType.slice(1)} sync completed successfully`);
        setStats(data);
      } else {
        setStatus('error');
        setMessage(`Sync failed: ${data.error || 'Unknown error'}`);
        setStats(data);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Error syncing ${syncType}`);
      console.error(error);
    }
  };
  
  // Sync all data types in sequence
  const syncAllData = async () => {
    if (status === 'loading' || isSyncingAll) return;
    
    setIsSyncingAll(true);
    setAllSyncProgress({ current: 0, total: 4, results: [] });
    setMessage('Starting full sync of all data to Farcaster...');
    
    const dataTypes = ['casts', 'comments', 'votes', 'follows'];
    const results = [] as Array<{
      type: string;
      success: boolean;
      synced?: number;
      failed?: number;
      total?: number;
      error?: string;
    }>;
    
    for (let i = 0; i < dataTypes.length; i++) {
      const dataType = dataTypes[i];
      setAllSyncProgress(prev => ({ ...prev, current: i + 1 }));
      setMessage(`Syncing ${dataType} (${i + 1}/${dataTypes.length})...`);
      
      try {
        const endpoint = `/api/sync/${dataType}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            hubbleUrl: hubbleUrl || undefined
          })
        });
        
        const result = await response.json();
        results.push({
          type: dataType,
          success: result.success,
          synced: result.synced,
          failed: result.failed,
          total: dataType === 'comments' ? result.totalComments :
                dataType === 'casts' ? result.totalCasts :
                dataType === 'votes' ? result.totalVotes :
                result.totalFollows
        });
        
        setAllSyncProgress(prev => ({ ...prev, results: [...results] }));
      } catch (error) {
        console.error(`Error syncing ${dataType}:`, error);
        results.push({
          type: dataType,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        setAllSyncProgress(prev => ({ ...prev, results: [...results] }));
      }
    }
    
    setStatus('success');
    setMessage('All data sync completed');
    setIsSyncingAll(false);
  };
  
  if (!user || !user.fid) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin: Sync to Farcaster</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          You must be logged in to access this page.
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin: Sync to Farcaster</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Hubble Connection</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hubble Node URL (override)
          </label>
          <input
            type="text"
            value={hubbleUrl}
            onChange={(e) => setHubbleUrl(e.target.value)}
            placeholder="http://localhost:2281"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use the default URL from environment config
          </p>
        </div>
        
        <button
          onClick={checkHubbleConnection}
          disabled={status === 'loading'}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          Check Connection
        </button>
        
        {hubbleInfo && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
            <h3 className="font-semibold">Hubble Info:</h3>
            <ul className="mt-2">
              <li>Status: <span className={`font-semibold ${hubbleInfo.hubbleStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>{hubbleInfo.hubbleStatus}</span></li>
              <li>HTTP URL: {hubbleInfo.config.hubbleHttpUrl}</li>
              <li>gRPC URL: {hubbleInfo.config.hubbleGrpcUrl}</li>
              {hubbleInfo.hubbleInfo && (
                <>
                  <li>Version: {hubbleInfo.hubbleInfo.version}</li>
                  <li>Syncing: {hubbleInfo.hubbleInfo.isSyncing ? 'Yes' : 'No'}</li>
                  <li>Network: {hubbleInfo.hubbleInfo.network}</li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">Sync All Data</h2>
        <p className="mb-4 text-gray-600">
          This will sequentially sync all your data (casts, comments, votes, and follows) to Farcaster.
          This can take several minutes depending on the amount of data.
        </p>
        
        <button
          onClick={syncAllData}
          disabled={status === 'loading' || isSyncingAll}
          className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {isSyncingAll ? 'Syncing All Data...' : 'Sync All Data to Farcaster'}
        </button>
        
        {isSyncingAll && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(allSyncProgress.current / allSyncProgress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Progress: {allSyncProgress.current} of {allSyncProgress.total} data types
            </p>
            
            {allSyncProgress.results.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold text-sm mb-2">Results so far:</h4>
                <ul className="space-y-1 text-sm">
                  {allSyncProgress.results.map((result, index) => (
                    <li key={index} className="flex justify-between">
                      <span className="capitalize">{result.type}:</span>
                      {result.success ? (
                        <span className="text-green-600">{result.synced} synced, {result.failed} failed (of {result.total})</span>
                      ) : (
                        <span className="text-red-600">Failed: {result.error || 'Unknown error'}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Sync Local Data to Farcaster</h2>
        <p className="mb-4 text-gray-600">
          This will attempt to sync local data from the data directory to the connected Farcaster Hubble node. 
          This process may take some time depending on the amount of data.
        </p>
        
        <div className="mb-4">
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="syncType"
                value="comments"
                checked={syncType === 'comments'}
                onChange={() => setSyncType('comments')}
                className="mr-2"
              />
              Comments (data/comments.json)
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="syncType"
                value="casts"
                checked={syncType === 'casts'}
                onChange={() => setSyncType('casts')}
                className="mr-2"
              />
              Casts (data/casts.json)
            </label>
          </div>
          
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="syncType"
                value="votes"
                checked={syncType === 'votes'}
                onChange={() => setSyncType('votes')}
                className="mr-2"
              />
              Votes (data/votes.json)
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="syncType"
                value="follows"
                checked={syncType === 'follows'}
                onChange={() => setSyncType('follows')}
                className="mr-2"
              />
              Follows (from email-users.json)
            </label>
          </div>
        </div>
        
        <button
          onClick={syncData}
          disabled={status === 'loading'}
          className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {status === 'loading' ? `Syncing ${syncType}...` : `Sync ${syncType} Now`}
        </button>
        
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            status === 'success' ? 'bg-green-50 text-green-700' :
            status === 'error' ? 'bg-red-50 text-red-700' : 
            'bg-blue-50 text-blue-700'
          }`}>
            {message}
          </div>
        )}
        
        {stats && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold mb-2">Sync Results:</h3>
            <ul className="space-y-1 text-sm">
              <li>Total {syncType.charAt(0).toUpperCase() + syncType.slice(1)}: {
                syncType === 'comments' ? stats.totalComments : 
                syncType === 'casts' ? stats.totalCasts :
                syncType === 'votes' ? stats.totalVotes :
                stats.totalFollows
              }</li>
              <li>Successfully Synced: <span className="text-green-600 font-semibold">{stats.synced}</span></li>
              <li>Failed: <span className="text-red-600 font-semibold">{stats.failed}</span></li>
            </ul>
            
            {stats.errors && stats.errors.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold text-sm">Errors:</h4>
                <ul className="mt-1 text-xs text-red-600 list-disc list-inside max-h-40 overflow-y-auto">
                  {stats.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
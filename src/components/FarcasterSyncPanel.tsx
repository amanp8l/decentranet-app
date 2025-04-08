import { useState } from 'react';

type SyncStats = {
  casts: { total: number; synced: number; failed: number };
  votes: { total: number; synced: number; failed: number };
  follows: { total: number; synced: number; failed: number };
  topics: { total: number; synced: number; failed: number };
  research: { total: number; synced: number; failed: number };
};

export default function FarcasterSyncPanel() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: boolean;
    stats: SyncStats;
    errors: string[];
  } | null>(null);
  const [syncType, setSyncType] = useState<'all' | 'casts' | 'topics' | 'research' | 'votes' | 'follows'>('all');

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      
      const endpoint = syncType === 'all' 
        ? '/api/sync/all'
        : `/api/sync/${syncType}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        const result = await response.json();
        setLastSyncResult(result);
        console.log(`Farcaster ${syncType} sync result:`, result);
      } else {
        const error = await response.text();
        console.error('Sync error:', error);
        setLastSyncResult({
          success: false,
          stats: {
            casts: { total: 0, synced: 0, failed: 0 },
            votes: { total: 0, synced: 0, failed: 0 },
            follows: { total: 0, synced: 0, failed: 0 },
            topics: { total: 0, synced: 0, failed: 0 },
            research: { total: 0, synced: 0, failed: 0 }
          },
          errors: [error]
        });
      }
    } catch (error) {
      console.error('Error during sync:', error);
      setLastSyncResult({
        success: false,
        stats: {
          casts: { total: 0, synced: 0, failed: 0 },
          votes: { total: 0, synced: 0, failed: 0 },
          follows: { total: 0, synced: 0, failed: 0 },
          topics: { total: 0, synced: 0, failed: 0 },
          research: { total: 0, synced: 0, failed: 0 }
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Farcaster Sync Control</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sync Type
        </label>
        <select
          value={syncType}
          onChange={(e) => setSyncType(e.target.value as any)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={isSyncing}
        >
          <option value="all">All Content</option>
          <option value="casts">Casts Only</option>
          <option value="topics">Forum Topics Only</option>
          <option value="research">Research Only</option>
          <option value="votes">Votes Only</option>
          <option value="follows">Follows Only</option>
        </select>
      </div>
      
      <button
        onClick={handleSyncAll}
        disabled={isSyncing}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          isSyncing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {isSyncing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Syncing...
          </span>
        ) : (
          `Sync ${syncType === 'all' ? 'All Content' : syncType} to Farcaster`
        )}
      </button>
      
      {lastSyncResult && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Last Sync Result</h3>
          <div className={`p-3 rounded-md mb-4 ${lastSyncResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className={`font-medium ${lastSyncResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {lastSyncResult.success ? 'Sync Successful' : 'Sync Failed'}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Synced
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Failed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(lastSyncResult.stats).map(([type, stats]) => (
                  <tr key={type}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {stats.synced}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {stats.failed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {lastSyncResult.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium mb-2 text-red-800">Errors</h4>
              <ul className="list-disc pl-5 text-sm text-red-700 bg-red-50 p-3 rounded-md">
                {lastSyncResult.errors.map((error, index) => (
                  <li key={index} className="mb-1">{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to local casts database
const CASTS_DB_PATH = path.join(process.cwd(), 'data', 'casts.json');

// Get casts from JSON file
function getLocalCasts() {
  if (!fs.existsSync(CASTS_DB_PATH)) {
    return [];
  }
  try {
    const data = fs.readFileSync(CASTS_DB_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading local casts:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    
    // First try to get locally stored casts that match the query
    const localCasts = getLocalCasts();
    let filteredLocalCasts = localCasts;
    
    // If a specific FID was provided, filter local casts for that user
    if (fid) {
      filteredLocalCasts = localCasts.filter((cast: any) => cast.fid === parseInt(fid));
    }
    
    // If we have local casts that match the query, return them
    if (filteredLocalCasts.length > 0) {
      return NextResponse.json({ 
        success: true, 
        data: filteredLocalCasts,
        source: 'local'
      });
    }
    
    // First check if the Hubble node is running and accessible
    try {
      // For Hubble v1.19.1, try fetching info endpoint
      const infoResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        console.log('Hubble node info:', infoData);
      } else {
        console.log(`Hubble info endpoint check: ${infoResponse.status} ${infoResponse.statusText}`);
      }
    } catch (healthError) {
      console.error('Failed to connect to Hubble node:', healthError);
      
      // If the Hubble node is not accessible, return mock data
      return NextResponse.json({ 
        success: true, 
        data: generateMockCasts(fid)
      });
    }
    
    // Try to fetch casts from the Hubble node
    try {
      // If a specific FID was provided, fetch casts for that user
      if (fid) {
        const response = await fetch(`${HUBBLE_HTTP_URL}/v1/castsByFid?fid=${fid}&pageSize=20`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const castsData = await response.json();
          
          // Check if the response has the expected structure
          if (castsData && Array.isArray(castsData.messages)) {
            return NextResponse.json({ 
              success: true, 
              data: castsData.messages.map((msg: any) => {
                const castData = msg.data?.castAddBody;
                return {
                  fid: msg.data?.fid || 0,
                  data: {
                    text: castData?.text || '',
                    timestamp: msg.data?.timestamp 
                      ? (msg.data.timestamp < 10000000000 ? msg.data.timestamp * 1000 : msg.data.timestamp)
                      : Date.now(),
                    mentions: castData?.mentions || [],
                    mentionsPositions: castData?.mentionsPositions || [],
                    embeds: castData?.embeds || []
                  }
                };
              }).filter((c: any) => c.data.text) // Only include casts with content
            });
          }
        }
        
        // If we couldn't get user casts, return mock data for that user
        return NextResponse.json({ 
          success: true, 
          data: generateMockCasts(fid)
        });
      }
      
      // If no FID was provided, try to get trending casts
      const trendingResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/trending-casts?limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        
        if (trendingData && Array.isArray(trendingData.casts)) {
          return NextResponse.json({ 
            success: true, 
            data: trendingData.casts.map((cast: any) => ({
              fid: cast.author?.fid || 0,
              data: {
                text: cast.text || '',
                timestamp: new Date(cast.timestamp || Date.now()).getTime(),
                mentions: cast.mentions || [],
                mentionsPositions: cast.mentionsPositions || [],
                embeds: cast.embeds || []
              }
            }))
          });
        }
      }
      
      // Try to get latest casts if trending fails
      const latestResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/castsByFid?fid=1043300&pageSize=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (latestResponse.ok) {
        const latestData = await latestResponse.json();
        
        if (latestData && Array.isArray(latestData.messages)) {
          return NextResponse.json({ 
            success: true, 
            data: latestData.messages.map((msg: any) => {
              const castData = msg.data?.castAddBody;
              return {
                fid: msg.data?.fid || 0,
                data: {
                  text: castData?.text || '',
                  timestamp: msg.data?.timestamp 
                    ? (msg.data.timestamp < 10000000000 ? msg.data.timestamp * 1000 : msg.data.timestamp)
                    : Date.now(),
                  mentions: castData?.mentions || [],
                  mentionsPositions: castData?.mentionsPositions || [],
                  embeds: castData?.embeds || []
                }
              };
            }).filter((c: any) => c.data.text) // Only include casts with content
          });
        }
      }
      
      // If all API calls failed, throw an error to use fallback data
      throw new Error('Could not fetch casts from Hubble node');
      
    } catch (fetchError) {
      console.error('Error fetching casts from Hubble node:', fetchError);
      
      // Return mock data since we couldn't get real data
      return NextResponse.json({ 
        success: true, 
        data: generateMockCasts(fid)
      });
    }
  } catch (error) {
    console.error('Error in casts API:', error);
    
    // Provide a helpful error message
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch casts. Make sure your Hubble node is running at http://localhost:2281'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate mock casts
function generateMockCasts(fid: string | null): any[] {
  // If we have a specific FID, generate casts for that user
  if (fid) {
    return [
      {
        fid: parseInt(fid),
        data: {
          text: `This is a mock cast from user with FID: ${fid}`,
          timestamp: Date.now(),
          mentions: [],
          mentionsPositions: [],
          embeds: []
        }
      },
      {
        fid: parseInt(fid),
        data: {
          text: `Another mock cast from FID: ${fid}. In a real app, this would show actual casts from this user.`,
          timestamp: Date.now() - 60000,
          mentions: [],
          mentionsPositions: [],
          embeds: []
        }
      },
      {
        fid: parseInt(fid),
        data: {
          text: `Warpcast integration example by FID: ${fid}`,
          timestamp: Date.now() - 120000,
          mentions: [],
          mentionsPositions: [],
          embeds: []
        }
      }
    ];
  }
  
  // Default mock casts for the feed
  return [
    {
      fid: 1043300,
      data: {
        text: "Welcome to Farcaster Social UI! This is the trending feed.",
        timestamp: Date.now(),
        mentions: [],
        mentionsPositions: [],
        embeds: []
      }
    },
    {
      fid: 1002,
      data: {
        text: "These are the popular posts across the Farcaster network.",
        timestamp: Date.now() - 60000,
        mentions: [],
        mentionsPositions: [],
        embeds: []
      }
    },
    {
      fid: 1003,
      data: {
        text: "You can also view specific user feeds by clicking on their profile.",
        timestamp: Date.now() - 120000,
        mentions: [],
        mentionsPositions: [],
        embeds: []
      }
    }
  ];
} 
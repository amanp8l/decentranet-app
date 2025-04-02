import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const HUBBLE_HTTP_URL = process.env.NEXT_PUBLIC_HUBBLE_HTTP_URL || 'http://localhost:2281';
    
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
        data: [
          {
            fid: 1001,
            data: {
              text: "Welcome to Farcaster Social UI! This is a mock cast since we couldn't connect to your Hubble node.",
              timestamp: Date.now(),
              mentions: [],
              mentionsPositions: [],
              embeds: []
            }
          },
          {
            fid: 1002,
            data: {
              text: "Make sure your Hubble node is running at http://localhost:2281",
              timestamp: Date.now() - 60000,
              mentions: [],
              mentionsPositions: [],
              embeds: []
            }
          },
          {
            fid: 1003,
            data: {
              text: "This is a decentralized app built with Next.js that connects to the Farcaster network.",
              timestamp: Date.now() - 120000,
              mentions: [],
              mentionsPositions: [],
              embeds: []
            }
          }
        ]
      });
    }
    
    // Try to fetch casts from the Hubble node
    try {
      // First attempt: try v1/castsByFid endpoint with HubOperatorFid (known to work with v1.19.1)
      const response = await fetch(`${HUBBLE_HTTP_URL}/v1/castsByFid?fid=15300&pageSize=10`, {
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
                  timestamp: msg.data?.timestamp || Date.now(),
                  mentions: castData?.mentions || [],
                  mentionsPositions: castData?.mentionsPositions || [],
                  embeds: castData?.embeds || []
                }
              };
            }).filter((c: any) => c.data.text) // Only include casts with content
          });
        }
      }
      
      // Second attempt: try with the trending endpoint
      const trendingResponse = await fetch(`${HUBBLE_HTTP_URL}/v1/trending-casts?limit=10`, {
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
      
      // If the first two attempts failed, throw an error to use fallback data
      throw new Error('Could not fetch casts from Hubble node');
      
    } catch (fetchError) {
      console.error('Error fetching casts from Hubble node:', fetchError);
      
      // Return mock data since we couldn't get real data
      return NextResponse.json({ 
        success: true, 
        data: [
          {
            fid: 15300,
            data: {
              text: "This is a mock cast for Hubble node v1.19.1 with operator FID: 15300",
              timestamp: Date.now(),
              mentions: [],
              mentionsPositions: [],
              embeds: []
            }
          },
          {
            fid: 1002,
            data: {
              text: "Your Hubble node is running but we couldn't fetch real casts. API structure might be different.",
              timestamp: Date.now() - 60000,
              mentions: [],
              mentionsPositions: [],
              embeds: []
            }
          },
          {
            fid: 1003,
            data: {
              text: "This is a demonstration of the Farcaster Social UI with mock data.",
              timestamp: Date.now() - 120000,
              mentions: [],
              mentionsPositions: [],
              embeds: []
            }
          }
        ]
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
import { getHubbleClient as getNeynarOrHubbleClient, closeHubbleClient as closeNeynarOrHubbleClient } from './neynar';

// Re-export the client functions from the neynar module
export const getHubbleClient = getNeynarOrHubbleClient;
export const closeHubbleClient = closeNeynarOrHubbleClient; 
import { getSSLHubRpcClient, HubRpcClient } from '@farcaster/hub-nodejs';

let client: HubRpcClient | null = null;

export const getHubbleClient = async (): Promise<HubRpcClient> => {
  if (!client) {
    // Connect to Hubble node
    const hubUrl = process.env.NEXT_PUBLIC_HUBBLE_GRPC_URL || 'http://localhost:2283';
    client = await getSSLHubRpcClient(hubUrl);
  }
  return client;
};

export const closeHubbleClient = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
  }
}; 
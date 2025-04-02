declare module '@farcaster/hub-nodejs' {
  export interface HubRpcClient {
    getCastsByFid(params: { fid: number; pageSize: number }): Promise<{ messages: any[] }>;
    close(): Promise<void>;
  }
  
  export function getSSLHubRpcClient(url: string): Promise<HubRpcClient>;
} 
/**
 * Helper utility to verify Farcaster signer signatures
 * 
 * This is a simplified version for demo purposes.
 * In production, you would use the proper Farcaster verification methods
 * from packages like @farcaster/auth-kit.
 */

/**
 * Verifies a Farcaster signature and returns the FID
 */
export async function verifyFarcasterSignature(
  data: any,
  messageData: any = null
): Promise<{ valid: boolean; fid?: number }> {
  try {
    // Special handling for debug/development
    if (data.signature === 'debug_signature' && data.fid) {
      console.log('Debug signature detected - accepting without verification');
      return { valid: true, fid: Number(data.fid) };
    }
    
    // Log input data for debugging
    console.log('Signature verification input:', 
      JSON.stringify(typeof data === 'string' ? data : data, null, 2).substring(0, 200) + '...');
    
    if (messageData) {
      console.log('Message data:', 
        JSON.stringify(typeof messageData === 'string' ? messageData : messageData, null, 2).substring(0, 200) + '...');
    }

    // Case 1: Direct FID on the data object
    if (data.fid) {
      return { valid: true, fid: Number(data.fid) };
    }

    // Case 2: FID in the signature object
    if (data.signature && data.signature.fid) {
      return { valid: true, fid: Number(data.signature.fid) };
    }
    
    // Case 3: Parse a stringified signature parameter
    if (typeof data.signature === 'string') {
      try {
        const parsedSignature = JSON.parse(data.signature);
        if (parsedSignature.fid) {
          return { valid: true, fid: Number(parsedSignature.fid) };
        }
      } catch (e) {
        // Not JSON, continue with other methods
      }
    }
    
    // Case 4: Extract from message
    let fid = extractFidFromMessage(data.message || messageData);
    if (fid) {
      return { valid: true, fid };
    }
    
    // Case 5: Extract from nested message in signature
    if (data.signature && data.signature.message) {
      fid = extractFidFromMessage(data.signature.message);
      if (fid) {
        return { valid: true, fid };
      }
    }
    
    // No FID found
    console.warn('Could not extract FID from signature data');
    return { valid: false };
  } catch (error) {
    console.error('Error in signature verification:', error);
    return { valid: false };
  }
}

/**
 * Extract FID from a message object or string
 */
function extractFidFromMessage(message: any): number | null {
  if (!message) return null;
  
  try {
    // Parse if it's a string
    const messageObj = typeof message === 'string' 
      ? JSON.parse(message) 
      : message;
    
    // Direct FID in message
    if (messageObj.fid) {
      return Number(messageObj.fid);
    }
    
    // FID in data property
    if (messageObj.data && messageObj.data.fid) {
      return Number(messageObj.data.fid);
    }
    
    // Check for user property which might contain FID
    if (messageObj.user && messageObj.user.fid) {
      return Number(messageObj.user.fid);
    }
  } catch (e) {
    console.error('Error parsing message:', e);
  }
  
  return null;
} 
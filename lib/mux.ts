/**
 * Mux Integration for Live Streaming
 * 
 * Mux provides live streaming infrastructure with HLS playback.
 * This module handles creating and managing Mux live streams.
 * 
 * Documentation: https://docs.mux.com/guides/video/stream-live-video
 */

import Mux from '@mux/mux-node';

let muxClient: Mux | null = null;

/**
 * Get or initialize Mux client
 */
export function getMuxClient(): Mux | null {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;

  if (!tokenId || !tokenSecret) {
    console.warn('MUX_TOKEN_ID and MUX_TOKEN_SECRET not set - Mux integration disabled');
    return null;
  }

  if (muxClient) {
    return muxClient;
  }

  muxClient = new Mux({
    tokenId,
    tokenSecret,
  });
  return muxClient;
}

/**
 * Check if Mux is configured
 */
export function isMuxConfigured(): boolean {
  return !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

/**
 * Create a new Mux live stream
 * 
 * @param title Stream title
 * @param creatorId Creator user ID (for metadata)
 * @returns Mux live stream object with RTMP URL and playback URL
 */
export async function createMuxLiveStream(
  title: string,
  creatorId: string
): Promise<{
  streamKey: string;
  rtmpUrl: string;
  playbackUrl: string;
  muxStreamId: string;
}> {
  const mux = getMuxClient();
  if (!mux) {
    throw new Error('Mux is not configured');
  }

  try {
    // Create live stream in Mux
    const liveStream = await mux.video.liveStreams.create({
      playback_policy: ['public'], // Allow public playback
      new_asset_settings: {
        playback_policy: ['public'], // Make replay assets public
      },
      reconnect_window: 60, // 60 seconds reconnect window
      reduced_latency: true, // Enable reduced latency mode
      passthrough: JSON.stringify({
        creatorId,
        title,
      }),
    });

    // Get RTMP URL and stream key
    const rtmpUrl = liveStream.stream_key
      ? `rtmp://global-live.mux.com:5222/app/${liveStream.stream_key}`
      : '';

    // Get HLS playback URL
    const playbackId = liveStream.playback_ids?.[0]?.id;
    const playbackUrl = playbackId
      ? `https://stream.mux.com/${playbackId}.m3u8`
      : '';

    return {
      streamKey: liveStream.stream_key || '',
      rtmpUrl,
      playbackUrl,
      muxStreamId: liveStream.id,
    };
  } catch (error: any) {
    console.error('Mux live stream creation error:', error);
    
    // Check if it's a plan limitation error
    if (error?.status === 400 && error?.error?.messages?.some((msg: string) => 
      msg.includes('unavailable on the free plan') || 
      msg.includes('Live streams are unavailable')
    )) {
      throw new Error('MUX_FREE_PLAN_LIMITATION');
    }
    
    throw new Error(`Failed to create Mux live stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get Mux live stream status
 * 
 * @param muxStreamId Mux stream ID
 * @returns Stream status
 */
export async function getMuxStreamStatus(muxStreamId: string): Promise<{
  status: 'active' | 'idle' | 'disconnected';
  activeAssetId?: string;
}> {
  const mux = getMuxClient();
  if (!mux) {
    throw new Error('Mux is not configured');
  }

  try {
    const liveStream = await mux.video.liveStreams.retrieve(muxStreamId);
    
    return {
      status: liveStream.status as 'active' | 'idle' | 'disconnected',
      activeAssetId: liveStream.active_asset_id || undefined,
    };
  } catch (error) {
    console.error('Mux stream status error:', error);
    throw new Error(`Failed to get Mux stream status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a Mux live stream
 * 
 * @param muxStreamId Mux stream ID
 */
export async function deleteMuxLiveStream(muxStreamId: string): Promise<void> {
  const mux = getMuxClient();
  if (!mux) {
    throw new Error('Mux is not configured');
  }

  try {
    // Type assertion needed due to TypeScript type definitions
    await (mux.video.liveStreams as any).delete(muxStreamId);
  } catch (error) {
    console.error('Mux stream deletion error:', error);
    // Don't throw - stream might already be deleted
  }
}

/**
 * Get replay asset URL from Mux
 * 
 * @param assetId Mux asset ID
 * @returns HLS playback URL for the asset
 */
export async function getMuxAssetPlaybackUrl(assetId: string): Promise<string> {
  const mux = getMuxClient();
  if (!mux) {
    throw new Error('Mux is not configured');
  }

  try {
    const asset = await mux.video.assets.retrieve(assetId);
    const playbackId = asset.playback_ids?.[0]?.id;
    
    if (!playbackId) {
      throw new Error('Asset has no playback ID');
    }

    return `https://stream.mux.com/${playbackId}.m3u8`;
  } catch (error) {
    console.error('Mux asset playback URL error:', error);
    throw new Error(`Failed to get asset playback URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


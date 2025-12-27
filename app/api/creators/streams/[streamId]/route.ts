import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import db from '@/lib/db';
import { getMuxStreamStatus, getMuxAssetPlaybackUrl } from '@/lib/mux';

/**
 * Start a live stream
 * POST /api/creators/streams/[streamId]/start
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const user = await requireRole('creator');
    const { streamId } = await params;

    // Get stream
    const streamResult = await db.query(
      'SELECT * FROM live_streams WHERE id = $1 AND creator_id = $2',
      [streamId, user.id]
    );

    if (streamResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    const stream = streamResult.rows[0];

    if (stream.status === 'live') {
      return NextResponse.json(
        { error: 'Stream is already live' },
        { status: 400 }
      );
    }

    if (stream.status === 'ended' || stream.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot start a stream that has ended or been cancelled' },
        { status: 400 }
      );
    }

    // Check Mux stream status if using Mux
    if (stream.mux_stream_id) {
      try {
        const muxStatus = await getMuxStreamStatus(stream.mux_stream_id);
        if (muxStatus.status === 'disconnected') {
          return NextResponse.json(
            { error: 'Stream is not connected. Please start your streaming software first.' },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Failed to check Mux stream status:', error);
        // Continue anyway - might be a temporary issue
      }
    }

    // Update stream status to live
    const updateResult = await db.query(
      `UPDATE live_streams 
       SET status = 'live', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [streamId]
    );

    const updatedStream = updateResult.rows[0];

    return NextResponse.json({
      stream: {
        id: updatedStream.id,
        status: updatedStream.status,
        startedAt: updatedStream.started_at,
        streamKey: updatedStream.stream_key,
        playbackUrl: updatedStream.playback_url,
      },
      message: 'Stream started successfully',
    });
  } catch (error) {
    console.error('Start stream error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Stop a live stream
 * POST /api/creators/streams/[streamId]/stop
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const user = await requireRole('creator');
    const { streamId } = await params;

    // Get stream
    const streamResult = await db.query(
      'SELECT * FROM live_streams WHERE id = $1 AND creator_id = $2',
      [streamId, user.id]
    );

    if (streamResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    const stream = streamResult.rows[0];

    if (stream.status !== 'live') {
      return NextResponse.json(
        { error: 'Stream is not currently live' },
        { status: 400 }
      );
    }

    // Check if we can get replay URL from Mux
    let replayUrl: string | null = null;
    if (stream.mux_stream_id) {
      try {
        const muxStatus = await getMuxStreamStatus(stream.mux_stream_id);
        if (muxStatus.activeAssetId) {
          replayUrl = await getMuxAssetPlaybackUrl(muxStatus.activeAssetId);
        }
      } catch (error) {
        console.error('Failed to get Mux replay URL:', error);
        // Continue without replay URL
      }
    }

    // Update stream status to ended
    const updateResult = await db.query(
      `UPDATE live_streams 
       SET status = 'ended', ended_at = CURRENT_TIMESTAMP, replay_url = COALESCE($2, replay_url), updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [streamId, replayUrl]
    );

    const updatedStream = updateResult.rows[0];

    // Update all active viewers to mark them as left
    await db.query(
      `UPDATE stream_viewers 
       SET left_at = CURRENT_TIMESTAMP
       WHERE stream_id = $1 AND left_at IS NULL`,
      [streamId]
    );

    return NextResponse.json({
      stream: {
        id: updatedStream.id,
        status: updatedStream.status,
        endedAt: updatedStream.ended_at,
      },
      message: 'Stream ended successfully',
    });
  } catch (error) {
    console.error('Stop stream error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get stream details
 * GET /api/creators/streams/[streamId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const user = await requireAuth();
    const { streamId } = await params;

    const result = await db.query(
      `SELECT 
        ls.*,
        u.email as creator_email,
        cp.display_name as creator_display_name
      FROM live_streams ls
      INNER JOIN users u ON ls.creator_id = u.id
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE ls.id = $1`,
      [streamId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    // Check if user has access (if not the creator)
    let hasAccess = row.creator_id === user.id;

    if (!hasAccess && row.visibility_type !== 'free') {
      if (row.visibility_type === 'subscriber') {
        // Check subscription
        const subResult = await db.query(
          `SELECT id FROM subscriptions 
           WHERE fan_id = $1 AND creator_id = $2 AND status = 'active' 
           AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
          [user.id, row.creator_id]
        );
        hasAccess = subResult.rows.length > 0;
      } else if (row.visibility_type === 'ppv') {
        // Check entitlement
        const entResult = await db.query(
          `SELECT id FROM stream_entitlements 
           WHERE stream_id = $1 AND user_id = $2`,
          [streamId, user.id]
        );
        hasAccess = entResult.rows.length > 0;
      }
    }

    const stream = {
      id: row.id,
      title: row.title,
      description: row.description,
      streamKey: row.stream_key,
      playbackUrl: row.playback_url,
      thumbnailUrl: row.thumbnail_url,
      status: row.status,
      visibilityType: row.visibility_type,
      priceCents: row.price_cents,
      viewerCount: row.viewer_count,
      peakViewerCount: row.peak_viewer_count,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      scheduledStartAt: row.scheduled_start_at,
      replayUrl: row.replay_url,
      isDisabled: row.is_disabled,
      createdAt: row.created_at,
      creator: {
        id: row.creator_id,
        email: row.creator_email,
        displayName: row.creator_display_name,
      },
      hasAccess,
    };

    return NextResponse.json({ stream });
  } catch (error) {
    console.error('Get stream error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Join a stream as a viewer
 * POST /api/streams/[streamId]/viewers
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const user = await requireAuth();
    const { streamId } = await params;

    // Check if stream exists and is live
    const streamResult = await db.query(
      'SELECT id, status, creator_id, visibility_type FROM live_streams WHERE id = $1',
      [streamId]
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

    // Check access (if not free)
    if (stream.visibility_type !== 'free') {
      // Check subscription or entitlement
      let hasAccess = false;

      if (stream.visibility_type === 'subscriber') {
        const subResult = await db.query(
          `SELECT id FROM subscriptions 
           WHERE fan_id = $1 AND creator_id = $2 AND status = 'active' 
           AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
          [user.id, stream.creator_id]
        );
        hasAccess = subResult.rows.length > 0;
      } else if (stream.visibility_type === 'ppv') {
        const entResult = await db.query(
          `SELECT id FROM stream_entitlements 
           WHERE stream_id = $1 AND user_id = $2`,
          [streamId, user.id]
        );
        hasAccess = entResult.rows.length > 0;
      }

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'You do not have access to this stream' },
          { status: 403 }
        );
      }
    }

    // Create or update viewer record
    await db.query(
      `INSERT INTO stream_viewers (stream_id, user_id, joined_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (stream_id, user_id) 
       DO UPDATE SET joined_at = CURRENT_TIMESTAMP, left_at = NULL`,
      [streamId, user.id]
    );

    // Update viewer count
    await db.query('SELECT update_stream_viewer_count($1)', [streamId]);

    return NextResponse.json({ message: 'Joined stream successfully' });
  } catch (error) {
    console.error('Join stream error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Leave a stream
 * DELETE /api/streams/[streamId]/viewers
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const user = await requireAuth();
    const { streamId } = await params;

    // Get viewer record
    const viewerResult = await db.query(
      'SELECT * FROM stream_viewers WHERE stream_id = $1 AND user_id = $2 AND left_at IS NULL',
      [streamId, user.id]
    );

    if (viewerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'You are not currently viewing this stream' },
        { status: 400 }
      );
    }

    const viewer = viewerResult.rows[0];
    const joinedAt = new Date(viewer.joined_at);
    const now = new Date();
    const watchDuration = Math.floor((now.getTime() - joinedAt.getTime()) / 1000);

    // Update viewer record
    await db.query(
      `UPDATE stream_viewers 
       SET left_at = CURRENT_TIMESTAMP, watch_duration_seconds = watch_duration_seconds + $1
       WHERE id = $2`,
      [watchDuration, viewer.id]
    );

    // Update viewer count
    await db.query('SELECT update_stream_viewer_count($1)', [streamId]);

    return NextResponse.json({ message: 'Left stream successfully' });
  } catch (error) {
    console.error('Leave stream error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


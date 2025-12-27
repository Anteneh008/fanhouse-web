import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import db from '@/lib/db';
import { randomUUID } from 'crypto';
import { createMuxLiveStream, isMuxConfigured } from '@/lib/mux';

/**
 * Create a new live stream
 * POST /api/creators/streams
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole('creator');

    // Check if creator is approved
    if (user.creatorStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved creators can go live' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, visibilityType = 'free', priceCents = 0, scheduledStartAt } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate visibility type
    if (!['free', 'subscriber', 'ppv'].includes(visibilityType)) {
      return NextResponse.json(
        { error: 'Invalid visibility type' },
        { status: 400 }
      );
    }

    // Validate price for PPV streams
    if (visibilityType === 'ppv' && priceCents <= 0) {
      return NextResponse.json(
        { error: 'PPV streams must have a price greater than 0' },
        { status: 400 }
      );
    }

    let streamKey: string;
    let playbackUrl: string | null = null;
    let rtmpUrl: string | null = null;
    let muxStreamId: string | null = null;

    // Create Mux live stream if configured
    if (isMuxConfigured()) {
      try {
        const muxStream = await createMuxLiveStream(title.trim(), user.id);
        streamKey = muxStream.streamKey;
        playbackUrl = muxStream.playbackUrl;
        rtmpUrl = muxStream.rtmpUrl;
        muxStreamId = muxStream.muxStreamId;
      } catch (error: any) {
        // Check if it's a free plan limitation
        if (error?.message === 'MUX_FREE_PLAN_LIMITATION') {
          console.warn('Mux live streaming not available on free plan, falling back to placeholder mode');
          // Fall back to placeholder mode
          streamKey = `stream_${user.id}_${Date.now()}_${randomUUID().substring(0, 8)}`;
          playbackUrl = null;
          rtmpUrl = null;
          muxStreamId = null;
        } else {
          console.error('Failed to create Mux stream:', error);
          return NextResponse.json(
            { error: 'Failed to create streaming infrastructure. Please try again.' },
            { status: 500 }
          );
        }
      }
    } else {
      // Fallback: Generate unique stream key (for testing without Mux)
      streamKey = `stream_${user.id}_${Date.now()}_${randomUUID().substring(0, 8)}`;
      playbackUrl = process.env.STREAMING_SERVICE_URL 
        ? `${process.env.STREAMING_SERVICE_URL}/stream/${streamKey}/playlist.m3u8`
        : null;
      rtmpUrl = null;
      muxStreamId = null;
    }

    // Create stream in database
    const result = await db.query(
      `INSERT INTO live_streams 
       (creator_id, title, description, stream_key, playback_url, rtmp_url, mux_stream_id, status, visibility_type, price_cents, scheduled_start_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8, $9, $10)
       RETURNING *`,
      [
        user.id,
        title.trim(),
        description?.trim() || null,
        streamKey,
        playbackUrl,
        rtmpUrl,
        muxStreamId,
        visibilityType,
        priceCents,
        scheduledStartAt ? new Date(scheduledStartAt) : null,
      ]
    );

    const stream = result.rows[0];

    return NextResponse.json({
      stream: {
        id: stream.id,
        title: stream.title,
        description: stream.description,
        streamKey: stream.stream_key,
        playbackUrl: stream.playback_url,
        rtmpUrl: stream.rtmp_url,
        status: stream.status,
        visibilityType: stream.visibility_type,
        priceCents: stream.price_cents,
        scheduledStartAt: stream.scheduled_start_at,
        createdAt: stream.created_at,
      },
      message: 'Stream created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create stream error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get creator's streams
 * GET /api/creators/streams
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole('creator');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Optional filter

    let query = `
      SELECT 
        ls.*,
        u.email as creator_email,
        cp.display_name as creator_display_name
      FROM live_streams ls
      INNER JOIN users u ON ls.creator_id = u.id
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE ls.creator_id = $1
    `;

    const params: any[] = [user.id];

    if (status) {
      query += ` AND ls.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY ls.created_at DESC`;

    const result = await db.query(query, params);

    const streams = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      streamKey: row.stream_key,
      playbackUrl: row.playback_url,
      rtmpUrl: row.rtmp_url,
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
      createdAt: row.created_at,
      creator: {
        id: row.creator_id,
        email: row.creator_email,
        displayName: row.creator_display_name,
      },
    }));

    return NextResponse.json({ streams });
  } catch (error) {
    console.error('Get streams error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


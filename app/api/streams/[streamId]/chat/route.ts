import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import { getAblyClient } from '@/lib/ably';

/**
 * Send a chat message in a live stream
 * POST /api/streams/[streamId]/chat
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const user = await requireAuth();
    const { streamId } = await params;

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message is too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Check if stream exists and is live
    const streamResult = await db.query(
      'SELECT id, status, creator_id FROM live_streams WHERE id = $1',
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

    // Check if user is viewing the stream
    const viewerResult = await db.query(
      'SELECT id FROM stream_viewers WHERE stream_id = $1 AND user_id = $2 AND left_at IS NULL',
      [streamId, user.id]
    );

    if (viewerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'You must be viewing the stream to send messages' },
        { status: 403 }
      );
    }

    // Check if user is creator or admin (moderator)
    const isModerator = stream.creator_id === user.id || user.role === 'admin';

    // Save chat message to database
    const messageResult = await db.query(
      `INSERT INTO stream_chat_messages (stream_id, user_id, message, is_moderator)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [streamId, user.id, message.trim(), isModerator]
    );

    const chatMessage = messageResult.rows[0];

    // Get user profile for display
    const userProfileResult = await db.query(
      'SELECT display_name FROM creator_profiles WHERE user_id = $1',
      [user.id]
    );
    const displayName = userProfileResult.rows[0]?.display_name || null;

    // Publish to Ably channel for real-time delivery
    const ablyClient = getAblyClient();
    if (ablyClient) {
      const channel = ablyClient.channels.get(`stream:${streamId}:chat`);
      await channel.publish('message', {
        id: chatMessage.id,
        streamId,
        userId: user.id,
        userEmail: user.email,
        displayName,
        message: chatMessage.message,
        isModerator: chatMessage.is_moderator,
        createdAt: chatMessage.created_at,
      });
    }

    return NextResponse.json({
      message: {
        id: chatMessage.id,
        streamId: chatMessage.stream_id,
        userId: chatMessage.user_id,
        message: chatMessage.message,
        isModerator: chatMessage.is_moderator,
        createdAt: chatMessage.created_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Send chat message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get chat messages for a stream
 * GET /api/streams/[streamId]/chat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const user = await requireAuth();
    const { streamId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Check if stream exists
    const streamResult = await db.query(
      'SELECT id, status FROM live_streams WHERE id = $1',
      [streamId]
    );

    if (streamResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Get chat messages
    const result = await db.query(
      `SELECT 
        scm.*,
        u.email as user_email,
        cp.display_name as user_display_name
      FROM stream_chat_messages scm
      INNER JOIN users u ON scm.user_id = u.id
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE scm.stream_id = $1 AND scm.is_deleted = false
      ORDER BY scm.created_at DESC
      LIMIT $2`,
      [streamId, limit]
    );

    const messages = result.rows.reverse().map((row) => ({
      id: row.id,
      streamId: row.stream_id,
      userId: row.user_id,
      message: row.message,
      isModerator: row.is_moderator,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        email: row.user_email,
        displayName: row.user_display_name,
      },
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get chat messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


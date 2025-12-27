import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Create a new message thread
 * POST /api/messages/threads/create
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { creatorId } = body;

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    if (user.role !== 'fan') {
      return NextResponse.json(
        { error: 'Only fans can create threads' },
        { status: 403 }
      );
    }

    if (user.id === creatorId) {
      return NextResponse.json(
        { error: 'Cannot create thread with yourself' },
        { status: 400 }
      );
    }

    // Verify creator exists and is approved
    const creatorResult = await db.query(
      'SELECT id, role, creator_status FROM users WHERE id = $1 AND role = $2',
      [creatorId, 'creator']
    );

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    if (creatorResult.rows[0].creator_status !== 'approved') {
      return NextResponse.json(
        { error: 'Creator is not approved' },
        { status: 400 }
      );
    }

    // Check if thread already exists
    const existingThread = await db.query(
      'SELECT id FROM message_threads WHERE fan_id = $1 AND creator_id = $2',
      [user.id, creatorId]
    );

    if (existingThread.rows.length > 0) {
      return NextResponse.json({
        thread: {
          id: existingThread.rows[0].id,
        },
        message: 'Thread already exists',
      });
    }

    // Create new thread
    const threadResult = await db.query(
      `INSERT INTO message_threads (fan_id, creator_id)
       VALUES ($1, $2)
       RETURNING *`,
      [user.id, creatorId]
    );

    const thread = threadResult.rows[0];

    return NextResponse.json({
      thread: {
        id: thread.id,
        fanId: thread.fan_id,
        creatorId: thread.creator_id,
        lastMessageAt: thread.last_message_at,
        lastMessagePreview: thread.last_message_preview,
        fanUnreadCount: thread.fan_unread_count,
        creatorUnreadCount: thread.creator_unread_count,
        createdAt: thread.created_at,
        updatedAt: thread.updated_at,
      },
    });
  } catch (error) {
    console.error('Create thread error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


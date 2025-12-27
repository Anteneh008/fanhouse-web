import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Get messages in a thread
 * GET /api/messages/threads/[threadId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const user = await requireAuth();
    const { threadId } = await params;

    // Verify user has access to this thread and get thread with user info
    const threadResult = await db.query(
      `SELECT 
        mt.*,
        uf.id as fan_id,
        uf.email as fan_email,
        cpf.display_name as fan_display_name,
        uc.id as creator_id,
        uc.email as creator_email,
        cpc.display_name as creator_display_name
      FROM message_threads mt
      INNER JOIN users uf ON mt.fan_id = uf.id
      INNER JOIN users uc ON mt.creator_id = uc.id
      LEFT JOIN creator_profiles cpf ON uf.id = cpf.user_id
      LEFT JOIN creator_profiles cpc ON uc.id = cpc.user_id
      WHERE mt.id = $1 AND (mt.fan_id = $2 OR mt.creator_id = $2)`,
      [threadId, user.id]
    );

    if (threadResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    // Get messages
    const messagesResult = await db.query(
      `SELECT 
        m.*,
        us.id as sender_id,
        us.email as sender_email,
        cps.display_name as sender_display_name
      FROM messages m
      INNER JOIN users us ON m.sender_id = us.id
      LEFT JOIN creator_profiles cps ON us.id = cps.user_id
      WHERE m.thread_id = $1
      ORDER BY m.created_at ASC`,
      [threadId]
    );

    const messages = messagesResult.rows.map((row) => ({
      id: row.id,
      threadId: row.thread_id,
      senderId: row.sender_id,
      recipientId: row.recipient_id,
      content: row.content,
      messageType: row.message_type,
      mediaUrl: row.media_url,
      priceCents: row.price_cents,
      isPaid: row.is_paid,
      paymentStatus: row.payment_status,
      transactionId: row.transaction_id,
      isRead: row.is_read,
      readAt: row.read_at,
      createdAt: row.created_at,
      sender: {
        id: row.sender_id,
        email: row.sender_email,
        displayName: row.sender_display_name,
      },
    }));

    // Mark messages as read
    await db.query(
      'SELECT mark_thread_messages_read($1, $2)',
      [threadId, user.id]
    );

    const threadRow = threadResult.rows[0];
    const thread = {
      id: threadRow.id,
      fanId: threadRow.fan_id,
      creatorId: threadRow.creator_id,
      lastMessageAt: threadRow.last_message_at,
      lastMessagePreview: threadRow.last_message_preview,
      fanUnreadCount: threadRow.fan_unread_count,
      creatorUnreadCount: threadRow.creator_unread_count,
      isArchivedByFan: threadRow.is_archived_by_fan,
      isArchivedByCreator: threadRow.is_archived_by_creator,
      createdAt: threadRow.created_at,
      updatedAt: threadRow.updated_at,
      fan: {
        id: threadRow.fan_id,
        email: threadRow.fan_email,
        displayName: threadRow.fan_display_name,
      },
      creator: {
        id: threadRow.creator_id,
        email: threadRow.creator_email,
        displayName: threadRow.creator_display_name,
      },
    };

    return NextResponse.json({ messages, thread });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


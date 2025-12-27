import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Get user's notifications
 * GET /api/notifications
 * 
 * Query params:
 * - limit: number of notifications to return (default: 20)
 * - offset: pagination offset (default: 0)
 * - unread_only: only return unread notifications (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const unreadOnly = searchParams.get('unread_only') === 'true';

    let query = `
      SELECT 
        n.*,
        u.email as related_user_email,
        cp.display_name as related_user_display_name
      FROM notifications n
      LEFT JOIN users u ON n.related_user_id = u.id
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE n.user_id = $1
    `;

    const params: unknown[] = [user.id];

    if (unreadOnly) {
      query += ' AND n.is_read = false';
    }

    query += ' ORDER BY n.created_at DESC LIMIT $2 OFFSET $3';

    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get unread count
    const unreadResult = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [user.id]
    );
    const unreadCount = parseInt(unreadResult.rows[0]?.count || '0', 10);

    const notifications = result.rows.map((row) => ({
      id: row.id,
      type: row.notification_type,
      title: row.title,
      message: row.message,
      isRead: row.is_read,
      readAt: row.read_at,
      relatedUser: row.related_user_id
        ? {
            id: row.related_user_id,
            email: row.related_user_email,
            displayName: row.related_user_display_name,
          }
        : null,
      relatedPostId: row.related_post_id,
      relatedMessageId: row.related_message_id,
      relatedTransactionId: row.related_transaction_id,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore: result.rows.length === limit,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Mark notifications as read
 * PATCH /api/notifications
 * 
 * Body:
 * - notificationIds: array of notification IDs to mark as read (optional, if not provided, marks all as read)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { notificationIds } = body;

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await db.query(
        `UPDATE notifications
         SET is_read = true, read_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND id = ANY($2::uuid[]) AND is_read = false`,
        [user.id, notificationIds]
      );
    } else {
      // Mark all as read
      await db.query(
        `UPDATE notifications
         SET is_read = true, read_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND is_read = false`,
        [user.id]
      );
    }

    // Get updated unread count
    const unreadResult = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [user.id]
    );
    const unreadCount = parseInt(unreadResult.rows[0]?.count || '0', 10);

    return NextResponse.json({
      message: 'Notifications marked as read',
      unreadCount,
    });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


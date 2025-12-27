import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Get message threads for current user
 * GET /api/messages/threads
 */
export async function GET() {
  try {
    const user = await requireAuth();

    // Get threads where user is either fan or creator
    const threadsResult = await db.query(
      `SELECT 
        mt.*,
        -- Fan info
        uf.id as fan_id,
        uf.email as fan_email,
        cpf.display_name as fan_display_name,
        -- Creator info
        uc.id as creator_id,
        uc.email as creator_email,
        cpc.display_name as creator_display_name
      FROM message_threads mt
      INNER JOIN users uf ON mt.fan_id = uf.id
      INNER JOIN users uc ON mt.creator_id = uc.id
      LEFT JOIN creator_profiles cpf ON uf.id = cpf.user_id
      LEFT JOIN creator_profiles cpc ON uc.id = cpc.user_id
      WHERE (mt.fan_id = $1 OR mt.creator_id = $1)
        AND (
          (mt.fan_id = $1 AND mt.is_archived_by_fan = false) OR
          (mt.creator_id = $1 AND mt.is_archived_by_creator = false)
        )
      ORDER BY mt.last_message_at DESC`,
      [user.id]
    );

    const threads = threadsResult.rows.map((row) => ({
      id: row.id,
      fanId: row.fan_id,
      creatorId: row.creator_id,
      lastMessageAt: row.last_message_at,
      lastMessagePreview: row.last_message_preview,
      fanUnreadCount: row.fan_unread_count,
      creatorUnreadCount: row.creator_unread_count,
      isArchivedByFan: row.is_archived_by_fan,
      isArchivedByCreator: row.is_archived_by_creator,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      fan: {
        id: row.fan_id,
        email: row.fan_email,
        displayName: row.fan_display_name,
      },
      creator: {
        id: row.creator_id,
        email: row.creator_email,
        displayName: row.creator_display_name,
      },
    }));

    return NextResponse.json({ threads });
  } catch (error) {
    console.error('Get threads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


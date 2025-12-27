import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Get all active live streams
 * GET /api/streams
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Get all active streams
    const result = await db.query(
      `SELECT 
        ls.*,
        u.email as creator_email,
        cp.display_name as creator_display_name,
        cp.profile_image_url as creator_profile_image
      FROM live_streams ls
      INNER JOIN users u ON ls.creator_id = u.id
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE ls.status = 'live' AND ls.is_disabled = false
      ORDER BY ls.started_at DESC`
    );

    const streams = await Promise.all(
      result.rows.map(async (row) => {
        // Check if user has access
        let hasAccess = row.visibility_type === 'free';

        if (user && !hasAccess) {
          if (row.visibility_type === 'subscriber') {
            const subResult = await db.query(
              `SELECT id FROM subscriptions 
               WHERE fan_id = $1 AND creator_id = $2 AND status = 'active' 
               AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
              [user.id, row.creator_id]
            );
            hasAccess = subResult.rows.length > 0;
          } else if (row.visibility_type === 'ppv') {
            const entResult = await db.query(
              `SELECT id FROM stream_entitlements 
               WHERE stream_id = $1 AND user_id = $2`,
              [row.id, user?.id]
            );
            hasAccess = entResult.rows.length > 0;
          }
        }

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          playbackUrl: row.playback_url,
          thumbnailUrl: row.thumbnail_url,
          status: row.status,
          visibilityType: row.visibility_type,
          priceCents: row.price_cents,
          viewerCount: row.viewer_count,
          startedAt: row.started_at,
          createdAt: row.created_at,
          creator: {
            id: row.creator_id,
            email: row.creator_email,
            displayName: row.creator_display_name,
            profileImageUrl: row.creator_profile_image,
          },
          hasAccess,
        };
      })
    );

    return NextResponse.json({ streams });
  } catch (error) {
    console.error('Get streams error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


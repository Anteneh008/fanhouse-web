import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import { hasPostAccess } from "@/lib/entitlements";

/**
 * Get a single post
 * GET /api/posts/[postId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { postId } = await params;

    // Get post with creator and media
    const postResult = await db.query(
      `SELECT 
        p.*,
        u.email as creator_email,
        cp.display_name as creator_display_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'fileUrl', m.file_url,
              'fileType', m.file_type,
              'thumbnailUrl', m.thumbnail_url,
              'sortOrder', m.sort_order
            ) ORDER BY m.sort_order
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as media
      FROM posts p
      INNER JOIN users u ON p.creator_id = u.id
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      LEFT JOIN media_assets m ON p.id = m.post_id
      WHERE p.id = $1 AND p.is_disabled = false
      GROUP BY p.id, u.email, cp.display_name`,
      [postId]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const row = postResult.rows[0];

    // Check access
    const hasAccess = user
      ? await hasPostAccess(user.id, postId)
      : row.visibility_type === "free";

    const post = {
      id: row.id,
      creatorId: row.creator_id,
      creator: {
        email: row.creator_email,
        displayName: row.creator_display_name,
      },
      content: hasAccess ? row.content : null,
      visibilityType: row.visibility_type,
      priceCents: row.price_cents,
      likesCount: row.likes_count,
      commentsCount: row.comments_count,
      createdAt: row.created_at,
      media: hasAccess
        ? row.media || []
        : row.media?.map((m: any) => ({
            ...m,
            fileUrl: m.thumbnailUrl || null,
          })) || [],
      hasAccess,
    };

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import db from "@/lib/db";

/**
 * Get a single post (creator's own post)
 * GET /api/creators/posts/[postId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireAuth();
    const { postId } = await params;

    // Check if user is a creator
    if (user.role !== "creator") {
      return NextResponse.json(
        { error: "Only creators can view their posts" },
        { status: 403 }
      );
    }

    // Get post with media
    const postResult = await db.query(
      `SELECT 
        p.*,
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
      LEFT JOIN media_assets m ON p.id = m.post_id
      WHERE p.id = $1 AND p.creator_id = $2
      GROUP BY p.id`,
      [postId, user.id]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const row = postResult.rows[0];
    const post = {
      id: row.id,
      creatorId: row.creator_id,
      content: row.content,
      visibilityType: row.visibility_type,
      priceCents: row.price_cents,
      isPinned: row.is_pinned,
      isDisabled: row.is_disabled,
      likesCount: row.likes_count,
      commentsCount: row.comments_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      media: row.media || [],
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

/**
 * Update a post
 * PUT /api/creators/posts/[postId]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireAuth();
    const { postId } = await params;

    // Check if user is an approved creator
    if (user.role !== "creator" || user.creatorStatus !== "approved") {
      return NextResponse.json(
        { error: "Only approved creators can update posts" },
        { status: 403 }
      );
    }

    // Verify the post belongs to the creator
    const postCheck = await db.query(
      "SELECT creator_id FROM posts WHERE id = $1",
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (postCheck.rows[0].creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only update your own posts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, visibilityType, priceCents } = body;

    // Validate input
    if (
      !visibilityType ||
      !["free", "subscriber", "ppv"].includes(visibilityType)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid visibility type. Must be 'free', 'subscriber', or 'ppv'",
        },
        { status: 400 }
      );
    }

    // PPV posts must have a price
    if (visibilityType === "ppv" && (!priceCents || priceCents <= 0)) {
      return NextResponse.json(
        { error: "PPV posts must have a price greater than 0" },
        { status: 400 }
      );
    }

    // Update post
    const result = await db.query(
      `UPDATE posts 
       SET content = $1, visibility_type = $2, price_cents = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [content?.trim() || null, visibilityType, priceCents || 0, postId]
    );

    const post = result.rows[0];

    return NextResponse.json({
      post: {
        id: post.id,
        creatorId: post.creator_id,
        content: post.content,
        visibilityType: post.visibility_type,
        priceCents: post.price_cents,
        updatedAt: post.updated_at,
      },
    });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import db from "@/lib/db";
import { PostVisibility } from "@/lib/types";

/**
 * Create a new post
 * POST /api/creators/posts
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user is an approved creator
    if (user.role !== "creator" || user.creatorStatus !== "approved") {
      return NextResponse.json(
        { error: "Only approved creators can create posts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, visibilityType, priceCents } = body;

    // Validate input
    if (!visibilityType || !["free", "subscriber", "ppv"].includes(visibilityType)) {
      return NextResponse.json(
        { error: "Invalid visibility type. Must be 'free', 'subscriber', or 'ppv'" },
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

    // Create post
    const result = await db.query(
      `INSERT INTO posts (creator_id, content, visibility_type, price_cents)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        user.id,
        content?.trim() || null,
        visibilityType,
        priceCents || 0,
      ]
    );

    const post = result.rows[0];

    return NextResponse.json(
      {
        post: {
          id: post.id,
          creatorId: post.creator_id,
          content: post.content,
          visibilityType: post.visibility_type,
          priceCents: post.price_cents,
          createdAt: post.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get creator's posts
 * GET /api/creators/posts
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== "creator") {
      return NextResponse.json(
        { error: "Only creators can view their posts" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get posts with media
    const postsResult = await db.query(
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
      WHERE p.creator_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );

    const posts = postsResult.rows.map((row) => ({
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
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


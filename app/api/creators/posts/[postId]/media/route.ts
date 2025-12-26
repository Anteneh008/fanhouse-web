import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import db from "@/lib/db";

/**
 * Add media to a post
 * POST /api/creators/posts/[postId]/media
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireAuth();
    const { postId } = await params;

    // Verify user owns the post
    const postResult = await db.query(
      "SELECT creator_id FROM posts WHERE id = $1",
      [postId]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (postResult.rows[0].creator_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to add media to this post" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileUrl, fileType, fileSize, mimeType, thumbnailUrl, width, height, duration, sortOrder } = body;

    // Validate required fields
    if (!fileUrl || !fileType) {
      return NextResponse.json(
        { error: "fileUrl and fileType are required" },
        { status: 400 }
      );
    }

    // Create media asset
    const result = await db.query(
      `INSERT INTO media_assets 
       (post_id, file_url, file_type, file_size, mime_type, thumbnail_url, width, height, duration, sort_order, processing_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed')
       RETURNING *`,
      [
        postId,
        fileUrl,
        fileType,
        fileSize || null,
        mimeType || null,
        thumbnailUrl || null,
        width || null,
        height || null,
        duration || null,
        sortOrder || 0,
      ]
    );

    return NextResponse.json(
      {
        media: {
          id: result.rows[0].id,
          postId: result.rows[0].post_id,
          fileUrl: result.rows[0].file_url,
          fileType: result.rows[0].file_type,
          sortOrder: result.rows[0].sort_order,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add media error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


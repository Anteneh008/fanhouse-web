import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import db from "@/lib/db";
import { notifyNewLike } from "@/lib/knock";

/**
 * Like or unlike a post
 * POST /api/posts/[postId]/like - Toggle like
 * DELETE /api/posts/[postId]/like - Unlike
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireAuth();
    const { postId } = await params;

    // Check if post exists
    const postResult = await db.query(
      "SELECT id FROM posts WHERE id = $1 AND is_disabled = false",
      [postId]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await db.query(
      "SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, user.id]
    );

    if (existingLike.rows.length > 0) {
      return NextResponse.json(
        { error: "Post already liked", liked: true },
        { status: 400 }
      );
    }

    // Add like
    await db.query(
      "INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)",
      [postId, user.id]
    );

    // Get updated likes count
    const countResult = await db.query(
      "SELECT likes_count FROM posts WHERE id = $1",
      [postId]
    );

    // Get post creator to notify them
    const postCreatorResult = await db.query(
      "SELECT creator_id FROM posts WHERE id = $1",
      [postId]
    );
    const creatorId = postCreatorResult.rows[0]?.creator_id;

    // Notify creator if like is on their post (async, don't wait)
    if (creatorId && creatorId !== user.id) {
      const likerProfileResult = await db.query(
        "SELECT display_name FROM creator_profiles WHERE user_id = $1",
        [user.id]
      );
      const likerName =
        likerProfileResult.rows[0]?.display_name || user.email;
      notifyNewLike(creatorId, postId, user.id, likerName).catch((error) => {
        console.error("Failed to send notification:", error);
      });
    }

    return NextResponse.json({
      message: "Post liked successfully",
      liked: true,
      likesCount: countResult.rows[0]?.likes_count || 0,
    });
  } catch (error) {
    console.error("Like post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireAuth();
    const { postId } = await params;

    // Remove like
    const result = await db.query(
      "DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, user.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Post not liked", liked: false },
        { status: 400 }
      );
    }

    // Get updated likes count
    const countResult = await db.query(
      "SELECT likes_count FROM posts WHERE id = $1",
      [postId]
    );

    return NextResponse.json({
      message: "Post unliked successfully",
      liked: false,
      likesCount: countResult.rows[0]?.likes_count || 0,
    });
  } catch (error) {
    console.error("Unlike post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Check if user has liked a post
 * GET /api/posts/[postId]/like
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireAuth();
    const { postId } = await params;

    const result = await db.query(
      "SELECT id FROM post_likes WHERE post_id = $1 AND user_id = $2",
      [postId, user.id]
    );

    return NextResponse.json({
      liked: result.rows.length > 0,
    });
  } catch (error) {
    console.error("Check like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


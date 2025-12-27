import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import db from "@/lib/db";

/**
 * Delete a comment
 * DELETE /api/posts/comments/[commentId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const user = await requireAuth();
    const { commentId } = await params;

    // Get comment to verify ownership
    const commentResult = await db.query(
      "SELECT post_id, user_id FROM post_comments WHERE id = $1 AND is_deleted = false",
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const comment = commentResult.rows[0];

    // Check if user owns the comment or is admin
    if (comment.user_id !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "You don't have permission to delete this comment" },
        { status: 403 }
      );
    }

    // Soft delete the comment
    await db.query(
      "UPDATE post_comments SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1",
      [commentId]
    );

    // Get updated comments count
    const countResult = await db.query(
      "SELECT comments_count FROM posts WHERE id = $1",
      [comment.post_id]
    );

    return NextResponse.json({
      message: "Comment deleted successfully",
      commentsCount: countResult.rows[0]?.comments_count || 0,
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


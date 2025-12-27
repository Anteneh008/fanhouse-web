import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import { notifyNewComment } from "@/lib/knock";

/**
 * Get comments for a post
 * GET /api/posts/[postId]/comments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await getCurrentUser();
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

    // Get comments with user info
    const commentsResult = await db.query(
      `SELECT 
        c.id,
        c.post_id as "postId",
        c.user_id as "userId",
        c.content,
        c.parent_comment_id as "parentCommentId",
        c.is_deleted as "isDeleted",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        u.email,
        cp.display_name as "displayName"
      FROM post_comments c
      INNER JOIN users u ON c.user_id = u.id
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE c.post_id = $1 AND c.is_deleted = false
      ORDER BY c.created_at ASC`,
      [postId]
    );

    const comments = commentsResult.rows.map((row) => ({
      id: row.id,
      postId: row.postId,
      userId: row.userId,
      content: row.content,
      parentCommentId: row.parentCommentId,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        email: row.email,
        displayName: row.displayName,
      },
    }));

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create a comment on a post
 * POST /api/posts/[postId]/comments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireAuth();
    const { postId } = await params;
    const body = await request.json();
    const { content, parentCommentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Comment is too long (max 5000 characters)" },
        { status: 400 }
      );
    }

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

    // If parent comment exists, verify it belongs to the same post
    if (parentCommentId) {
      const parentResult = await db.query(
        "SELECT post_id FROM post_comments WHERE id = $1 AND is_deleted = false",
        [parentCommentId]
      );

      if (parentResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      if (parentResult.rows[0].post_id !== postId) {
        return NextResponse.json(
          { error: "Parent comment does not belong to this post" },
          { status: 400 }
        );
      }
    }

    // Create comment
    const result = await db.query(
      `INSERT INTO post_comments (post_id, user_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [postId, user.id, content.trim(), parentCommentId || null]
    );

    // Get updated comment with user info
    const commentResult = await db.query(
      `SELECT 
        c.id,
        c.post_id as "postId",
        c.user_id as "userId",
        c.content,
        c.parent_comment_id as "parentCommentId",
        c.is_deleted as "isDeleted",
        c.created_at as "createdAt",
        c.updated_at as "updatedAt",
        u.email,
        cp.display_name as "displayName"
      FROM post_comments c
      INNER JOIN users u ON c.user_id = u.id
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE c.id = $1`,
      [result.rows[0].id]
    );

    // Get updated comments count
    const countResult = await db.query(
      "SELECT comments_count FROM posts WHERE id = $1",
      [postId]
    );

    // Get post creator to notify them
    const postCreatorResult = await db.query(
      "SELECT creator_id FROM posts WHERE id = $1",
      [postId]
    );
    const creatorId = postCreatorResult.rows[0]?.creator_id;

    // Notify creator if comment is on their post (async, don't wait)
    if (creatorId && creatorId !== user.id) {
      const commenterName =
        commentResult.rows[0]?.displayName || commentResult.rows[0]?.email;
      notifyNewComment(creatorId, postId, user.id, commenterName).catch(
        (error) => {
          console.error("Failed to send notification:", error);
        }
      );
    }

    return NextResponse.json(
      {
        comment: commentResult.rows[0]
          ? {
              id: commentResult.rows[0].id,
              postId: commentResult.rows[0].postId,
              userId: commentResult.rows[0].userId,
              content: commentResult.rows[0].content,
              parentCommentId: commentResult.rows[0].parentCommentId,
              isDeleted: commentResult.rows[0].isDeleted,
              createdAt: commentResult.rows[0].createdAt,
              updatedAt: commentResult.rows[0].updatedAt,
              user: {
                email: commentResult.rows[0].email,
                displayName: commentResult.rows[0].displayName,
              },
            }
          : null,
        commentsCount: countResult.rows[0]?.comments_count || 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


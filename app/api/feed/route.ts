import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import { hasPostAccess } from "@/lib/entitlements";

/**
 * Get feed of posts
 * GET /api/feed
 * 
 * Returns posts the user has access to:
 * - Free posts (everyone)
 * - Subscriber posts (if subscribed)
 * - PPV posts (if purchased)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || null;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const creatorId = searchParams.get("creatorId"); // Optional: filter by creator

    // Build query based on user access
    let query = `
      SELECT 
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
      WHERE p.is_disabled = false
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    // Filter by creator if specified
    if (creatorId) {
      query += ` AND p.creator_id = $${paramIndex}`;
      queryParams.push(creatorId);
      paramIndex++;
    }

    query += ` GROUP BY p.id, u.email, cp.display_name
               ORDER BY p.created_at DESC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const postsResult = await db.query(query, queryParams);

    // Filter posts based on access
    const accessiblePosts = [];
    for (const row of postsResult.rows) {
      // Free posts are accessible to everyone
      if (row.visibility_type === "free") {
        accessiblePosts.push({
          id: row.id,
          creatorId: row.creator_id,
          creator: {
            email: row.creator_email,
            displayName: row.creator_display_name,
          },
          content: row.content,
          visibilityType: row.visibility_type,
          priceCents: row.price_cents,
          likesCount: row.likes_count,
          commentsCount: row.comments_count,
          createdAt: row.created_at,
          media: row.media || [],
          hasAccess: true,
        });
        continue;
      }

      // For subscriber/PPV posts, check access
      if (userId) {
        const hasAccess = await hasPostAccess(userId, row.id);
        if (hasAccess) {
          accessiblePosts.push({
            id: row.id,
            creatorId: row.creator_id,
            creator: {
              email: row.creator_email,
              displayName: row.creator_display_name,
            },
            content: row.content,
            visibilityType: row.visibility_type,
            priceCents: row.price_cents,
            likesCount: row.likes_count,
            commentsCount: row.comments_count,
            createdAt: row.created_at,
            media: row.media || [],
            hasAccess: true,
          });
        } else {
          // Show post but mark as locked - hide all media except thumbnails
          accessiblePosts.push({
            id: row.id,
            creatorId: row.creator_id,
            creator: {
              email: row.creator_email,
              displayName: row.creator_display_name,
            },
            content: null, // Hide content
            visibilityType: row.visibility_type,
            priceCents: row.price_cents,
            likesCount: row.likes_count,
            commentsCount: row.comments_count,
            createdAt: row.created_at,
            // Only include media items that have thumbnails, and only show thumbnails
            media: row.media?.filter((m: any) => m.thumbnailUrl).map((m: any) => ({
              id: m.id,
              fileUrl: m.thumbnailUrl, // Only thumbnail, not the actual file
              fileType: m.fileType,
              thumbnailUrl: m.thumbnailUrl,
            })) || [],
            hasAccess: false,
          });
        }
      } else {
        // Not logged in - show locked - hide all media except thumbnails
        accessiblePosts.push({
          id: row.id,
          creatorId: row.creator_id,
          creator: {
            email: row.creator_email,
            displayName: row.creator_display_name,
          },
          content: null,
          visibilityType: row.visibility_type,
          priceCents: row.price_cents,
          likesCount: row.likes_count,
          commentsCount: row.comments_count,
          createdAt: row.created_at,
          // Only include media items that have thumbnails, and only show thumbnails
          media: row.media?.filter((m: any) => m.thumbnailUrl).map((m: any) => ({
            id: m.id,
            fileUrl: m.thumbnailUrl, // Only thumbnail, not the actual file
            fileType: m.fileType,
            thumbnailUrl: m.thumbnailUrl,
          })) || [],
          hasAccess: false,
        });
      }
    }

    return NextResponse.json({ posts: accessiblePosts });
  } catch (error) {
    console.error("Get feed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


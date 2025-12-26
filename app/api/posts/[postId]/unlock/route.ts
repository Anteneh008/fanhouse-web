import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import db from "@/lib/db";
import { grantEntitlement } from "@/lib/entitlements";
import { createLedgerEntry } from "@/lib/ledger";

/**
 * Unlock a PPV post (mock payment)
 * POST /api/posts/[postId]/unlock
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await requireAuth();
    const { postId } = await params;

    // Get post details
    const postResult = await db.query(
      "SELECT creator_id, visibility_type, price_cents FROM posts WHERE id = $1 AND is_disabled = false",
      [postId]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const post = postResult.rows[0];

    // Check if it's a PPV post
    if (post.visibility_type !== "ppv") {
      return NextResponse.json(
        { error: "This post is not a PPV post" },
        { status: 400 }
      );
    }

    // Check if user already has access
    const existingEntitlement = await db.query(
      `SELECT id FROM entitlements 
       WHERE user_id = $1 
       AND post_id = $2 
       AND entitlement_type = 'ppv_purchase'`,
      [user.id, postId]
    );

    if (existingEntitlement.rows.length > 0) {
      return NextResponse.json(
        { error: "You already have access to this post" },
        { status: 400 }
      );
    }

    // Check if user is trying to unlock their own post
    if (post.creator_id === user.id) {
      return NextResponse.json(
        { error: "You cannot purchase your own post" },
        { status: 400 }
      );
    }

    // Start transaction
    await db.query("BEGIN");

    try {
      // Create transaction record (mock payment - always succeeds)
      const transactionResult = await db.query(
        `INSERT INTO transactions 
         (user_id, creator_id, post_id, amount_cents, transaction_type, status, payment_provider)
         VALUES ($1, $2, $3, $4, 'ppv', 'completed', 'mock')
         RETURNING id`,
        [user.id, post.creator_id, postId, post.price_cents]
      );

      const transactionId = transactionResult.rows[0].id;

      // Grant entitlement
      await grantEntitlement(
        user.id,
        postId,
        "ppv_purchase",
        undefined,
        transactionId
      );

      // Create ledger entry for creator earnings
      await createLedgerEntry(
        post.creator_id,
        post.price_cents,
        "earnings",
        transactionId,
        `PPV purchase: Post ${postId}`
      );

      await db.query("COMMIT");

      return NextResponse.json({
        message: "Post unlocked successfully",
        transactionId,
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Unlock post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


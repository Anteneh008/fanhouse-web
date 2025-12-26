import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import db from "@/lib/db";
import { CreatorApplicationRequest } from "@/lib/types";

/**
 * Apply to become a creator
 * POST /api/creators/apply
 *
 * Requirements:
 * - User must be authenticated
 * - User must have role 'fan' (not already a creator)
 * - Creates creator profile and sets creator_status to 'pending'
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user is already a creator
    if (user.role === "creator") {
      return NextResponse.json(
        { error: "You are already a creator" },
        { status: 400 }
      );
    }

    // Check if user already has a pending application
    if (user.creatorStatus === "pending") {
      return NextResponse.json(
        { error: "You already have a pending creator application" },
        { status: 400 }
      );
    }

    const body: CreatorApplicationRequest = await request.json();
    const { displayName, bio } = body;

    // Validate input
    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    if (displayName.length > 255) {
      return NextResponse.json(
        { error: "Display name must be 255 characters or less" },
        { status: 400 }
      );
    }

    // Start transaction: update user role and create profile
    await db.query("BEGIN");

    try {
      // Update user to creator role with pending status
      await db.query(
        `UPDATE users 
         SET role = 'creator', creator_status = 'pending'
         WHERE id = $1`,
        [user.id]
      );

      // Create creator profile
      await db.query(
        `INSERT INTO creator_profiles (user_id, display_name, bio)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
         SET display_name = EXCLUDED.display_name,
             bio = EXCLUDED.bio,
             updated_at = CURRENT_TIMESTAMP`,
        [user.id, displayName.trim(), bio?.trim() || null]
      );

      // Create initial KYC verification record (pending)
      await db.query(
        `INSERT INTO kyc_verifications (user_id, status, verification_type)
         VALUES ($1, 'pending', 'kyc')
         ON CONFLICT (user_id, verification_type) DO NOTHING`,
        [user.id]
      );

      await db.query("COMMIT");

      return NextResponse.json({
        message: "Creator application submitted successfully",
        status: "pending",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Creator application error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Get creator profile
 * GET /api/creators/profile
 */
export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can view their profile' },
        { status: 403 }
      );
    }

    const profileResult = await db.query(
      'SELECT * FROM creator_profiles WHERE user_id = $1',
      [user.id]
    );

    if (profileResult.rows.length === 0) {
      return NextResponse.json({
        profile: null,
        message: 'Profile not found',
      });
    }

    const profile = profileResult.rows[0];

    return NextResponse.json({
      profile: {
        displayName: profile.display_name,
        bio: profile.bio,
        subscriptionPriceCents: profile.subscription_price_cents,
        profileImageUrl: profile.profile_image_url,
        coverImageUrl: profile.cover_image_url,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update creator profile
 * PUT /api/creators/profile
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can update their profile' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { displayName, bio, subscriptionPriceCents } = body;

    // Validate input
    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      );
    }

    if (displayName.length > 255) {
      return NextResponse.json(
        { error: 'Display name must be 255 characters or less' },
        { status: 400 }
      );
    }

    if (subscriptionPriceCents === undefined || subscriptionPriceCents < 0) {
      return NextResponse.json(
        { error: 'Subscription price must be 0 or greater' },
        { status: 400 }
      );
    }

    // Update or create profile
    const profileResult = await db.query(
      `INSERT INTO creator_profiles (user_id, display_name, bio, subscription_price_cents)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           bio = EXCLUDED.bio,
           subscription_price_cents = EXCLUDED.subscription_price_cents,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user.id, displayName.trim(), bio?.trim() || null, subscriptionPriceCents]
    );

    const profile = profileResult.rows[0];

    return NextResponse.json({
      profile: {
        displayName: profile.display_name,
        bio: profile.bio,
        subscriptionPriceCents: profile.subscription_price_cents,
        profileImageUrl: profile.profile_image_url,
        coverImageUrl: profile.cover_image_url,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


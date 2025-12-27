import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Get user's notification preferences
 * GET /api/notifications/preferences
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const result = await db.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      // Return default preferences
      return NextResponse.json({
        emailEnabled: true,
        inAppEnabled: true,
        newMessageEnabled: true,
        newMessageEmailEnabled: true,
        newPostEnabled: true,
        newPostEmailEnabled: true,
        subscriptionRenewedEnabled: true,
        subscriptionRenewedEmailEnabled: true,
        paymentReceivedEnabled: true,
        paymentReceivedEmailEnabled: true,
        newFollowerEnabled: true,
        newFollowerEmailEnabled: true,
        newCommentEnabled: true,
        newCommentEmailEnabled: true,
        newLikeEnabled: true,
        newLikeEmailEnabled: true,
      });
    }

    const row = result.rows[0];
    return NextResponse.json({
      emailEnabled: row.email_enabled ?? true,
      inAppEnabled: row.in_app_enabled ?? true,
      newMessageEnabled: row.new_message_enabled ?? true,
      newMessageEmailEnabled: row.new_message_email_enabled ?? true,
      newPostEnabled: row.new_post_enabled ?? true,
      newPostEmailEnabled: row.new_post_email_enabled ?? true,
      subscriptionRenewedEnabled: row.subscription_renewed_enabled ?? true,
      subscriptionRenewedEmailEnabled: row.subscription_renewed_email_enabled ?? true,
      paymentReceivedEnabled: row.payment_received_enabled ?? true,
      paymentReceivedEmailEnabled: row.payment_received_email_enabled ?? true,
      newFollowerEnabled: row.new_follower_enabled ?? true,
      newFollowerEmailEnabled: row.new_follower_email_enabled ?? true,
      newCommentEnabled: row.new_comment_enabled ?? true,
      newCommentEmailEnabled: row.new_comment_email_enabled ?? true,
      newLikeEnabled: row.new_like_enabled ?? true,
      newLikeEmailEnabled: row.new_like_email_enabled ?? true,
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update user's notification preferences
 * PUT /api/notifications/preferences
 * 
 * Body: Partial notification preferences object
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Check if preferences exist
    const existingResult = await db.query(
      'SELECT id FROM notification_preferences WHERE user_id = $1',
      [user.id]
    );

    if (existingResult.rows.length === 0) {
      // Create new preferences
      await db.query(
        `INSERT INTO notification_preferences
         (user_id, email_enabled, in_app_enabled, new_message_enabled, new_message_email_enabled,
          new_post_enabled, new_post_email_enabled, subscription_renewed_enabled, subscription_renewed_email_enabled,
          payment_received_enabled, payment_received_email_enabled, new_follower_enabled, new_follower_email_enabled,
          new_comment_enabled, new_comment_email_enabled, new_like_enabled, new_like_email_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          user.id,
          body.emailEnabled ?? true,
          body.inAppEnabled ?? true,
          body.newMessageEnabled ?? true,
          body.newMessageEmailEnabled ?? true,
          body.newPostEnabled ?? true,
          body.newPostEmailEnabled ?? true,
          body.subscriptionRenewedEnabled ?? true,
          body.subscriptionRenewedEmailEnabled ?? true,
          body.paymentReceivedEnabled ?? true,
          body.paymentReceivedEmailEnabled ?? true,
          body.newFollowerEnabled ?? true,
          body.newFollowerEmailEnabled ?? true,
          body.newCommentEnabled ?? true,
          body.newCommentEmailEnabled ?? true,
          body.newLikeEnabled ?? true,
          body.newLikeEmailEnabled ?? true,
        ]
      );
    } else {
      // Update existing preferences
      await db.query(
        `UPDATE notification_preferences
         SET 
           email_enabled = COALESCE($2, email_enabled),
           in_app_enabled = COALESCE($3, in_app_enabled),
           new_message_enabled = COALESCE($4, new_message_enabled),
           new_message_email_enabled = COALESCE($5, new_message_email_enabled),
           new_post_enabled = COALESCE($6, new_post_enabled),
           new_post_email_enabled = COALESCE($7, new_post_email_enabled),
           subscription_renewed_enabled = COALESCE($8, subscription_renewed_enabled),
           subscription_renewed_email_enabled = COALESCE($9, subscription_renewed_email_enabled),
           payment_received_enabled = COALESCE($10, payment_received_enabled),
           payment_received_email_enabled = COALESCE($11, payment_received_email_enabled),
           new_follower_enabled = COALESCE($12, new_follower_enabled),
           new_follower_email_enabled = COALESCE($13, new_follower_email_enabled),
           new_comment_enabled = COALESCE($14, new_comment_enabled),
           new_comment_email_enabled = COALESCE($15, new_comment_email_enabled),
           new_like_enabled = COALESCE($16, new_like_enabled),
           new_like_email_enabled = COALESCE($17, new_like_email_enabled),
           updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [
          user.id,
          body.emailEnabled,
          body.inAppEnabled,
          body.newMessageEnabled,
          body.newMessageEmailEnabled,
          body.newPostEnabled,
          body.newPostEmailEnabled,
          body.subscriptionRenewedEnabled,
          body.subscriptionRenewedEmailEnabled,
          body.paymentReceivedEnabled,
          body.paymentReceivedEmailEnabled,
          body.newFollowerEnabled,
          body.newFollowerEmailEnabled,
          body.newCommentEnabled,
          body.newCommentEmailEnabled,
          body.newLikeEnabled,
          body.newLikeEmailEnabled,
        ]
      );
    }

    return NextResponse.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


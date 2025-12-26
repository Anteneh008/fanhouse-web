import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Cancel a subscription
 * POST /api/subscriptions/[subscriptionId]/cancel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const user = await requireAuth();
    const { subscriptionId } = await params;

    // Verify subscription belongs to user
    const subscriptionResult = await db.query(
      'SELECT * FROM subscriptions WHERE id = $1 AND fan_id = $2',
      [subscriptionId, user.id]
    );

    if (subscriptionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const subscription = subscriptionResult.rows[0];

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      );
    }

    // Cancel subscription (set auto_renew to false, status remains active until expires)
    await db.query(
      'UPDATE subscriptions SET auto_renew = false WHERE id = $1',
      [subscriptionId]
    );

    return NextResponse.json({
      message: 'Subscription canceled successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        autoRenew: false,
        expiresAt: subscription.expires_at,
      },
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


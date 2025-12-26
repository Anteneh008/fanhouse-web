import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Create a subscription
 * POST /api/subscriptions
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { creatorId, tierName } = body;

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    // Verify creator exists and is approved
    const creatorResult = await db.query(
      `SELECT u.id, cp.subscription_price_cents
       FROM users u
       INNER JOIN creator_profiles cp ON u.id = cp.user_id
       WHERE u.id = $1 AND u.role = 'creator' AND u.creator_status = 'approved'`,
      [creatorId]
    );

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Creator not found or not approved' },
        { status: 404 }
      );
    }

    const creator = creatorResult.rows[0];

    // Check if already subscribed
    const existingSubResult = await db.query(
      'SELECT id FROM subscriptions WHERE fan_id = $1 AND creator_id = $2 AND status = $3',
      [user.id, creatorId, 'active']
    );

    if (existingSubResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Already subscribed to this creator' },
        { status: 400 }
      );
    }

    // Can't subscribe to yourself
    if (user.id === creatorId) {
      return NextResponse.json(
        { error: 'Cannot subscribe to yourself' },
        { status: 400 }
      );
    }

    const priceCents = creator.subscription_price_cents || 0;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

    // Create subscription
    const subscriptionResult = await db.query(
      `INSERT INTO subscriptions 
       (fan_id, creator_id, tier_name, price_cents, status, started_at, expires_at, auto_renew)
       VALUES ($1, $2, $3, $4, 'active', $5, $6, true)
       RETURNING *`,
      [user.id, creatorId, tierName || 'default', priceCents, now, expiresAt]
    );

    const subscription = subscriptionResult.rows[0];

    // Create transaction (mock payment - always succeeds for MVP)
    const transactionResult = await db.query(
      `INSERT INTO transactions
       (fan_id, creator_id, amount_cents, currency, transaction_type, status, payment_method, metadata)
       VALUES ($1, $2, $3, 'USD', 'subscription', 'completed', 'mock', $4)
       RETURNING *`,
      [
        user.id,
        creatorId,
        priceCents,
        JSON.stringify({ subscription_id: subscription.id }),
      ]
    );

    // Create ledger entry for creator earnings
    const platformFeeCents = Math.floor(priceCents * 0.2); // 20% platform fee
    const netAmountCents = priceCents - platformFeeCents;

    await db.query(
      `INSERT INTO ledger_entries
       (creator_id, entry_type, amount_cents, platform_fee_cents, net_amount_cents, description, transaction_id)
       VALUES ($1, 'earnings', $2, $3, $4, $5, $6)`,
      [
        creatorId,
        priceCents,
        platformFeeCents,
        netAmountCents,
        `Subscription payment from ${user.email}`,
        transactionResult.rows[0].id,
      ]
    );

    return NextResponse.json(
      {
        subscription: {
          id: subscription.id,
          creatorId: subscription.creator_id,
          status: subscription.status,
          expiresAt: subscription.expires_at,
        },
        message: 'Subscription created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get user's subscriptions
 * GET /api/subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const subscriptionsResult = await db.query(
      `SELECT 
        s.*,
        u.email as creator_email,
        cp.display_name as creator_display_name
      FROM subscriptions s
      INNER JOIN users u ON s.creator_id = u.id
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE s.fan_id = $1
      ORDER BY s.started_at DESC`,
      [user.id]
    );

    const subscriptions = subscriptionsResult.rows.map((row) => ({
      id: row.id,
      creatorId: row.creator_id,
      creatorEmail: row.creator_email,
      creatorDisplayName: row.creator_display_name,
      tierName: row.tier_name,
      priceCents: row.price_cents,
      status: row.status,
      startedAt: row.started_at,
      expiresAt: row.expires_at,
      autoRenew: row.auto_renew,
    }));

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


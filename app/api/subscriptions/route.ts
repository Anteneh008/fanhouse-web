import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCCBillConfig, generateCCBillPaymentLink } from '@/lib/ccbill';
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
      `SELECT u.id, u.role, u.creator_status, cp.subscription_price_cents
       FROM users u
       LEFT JOIN creator_profiles cp ON u.id = cp.user_id
       WHERE u.id = $1`,
      [creatorId]
    );

    if (creatorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    const creator = creatorResult.rows[0];

    // Check if user is a creator
    if (creator.role !== 'creator') {
      return NextResponse.json(
        { error: 'User is not a creator' },
        { status: 400 }
      );
    }

    // Check if creator is approved
    if (creator.creator_status !== 'approved') {
      return NextResponse.json(
        { error: 'Creator is not approved yet' },
        { status: 400 }
      );
    }

    // Check if creator has a profile (subscription_price_cents can be 0 for free subscriptions)
    if (creator.subscription_price_cents === null || creator.subscription_price_cents === undefined) {
      return NextResponse.json(
        { error: 'Creator has not set up their subscription price yet' },
        { status: 400 }
      );
    }

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

    // Get subscription price (default to 0 if not set, but warn)
    const priceCents = creator.subscription_price_cents ?? 0;
    
    if (priceCents < 0) {
      return NextResponse.json(
        { error: 'Invalid subscription price' },
        { status: 400 }
      );
    }
    // Check if CCBill is configured
    const ccbillConfig = getCCBillConfig();
    const useMockPayments = !ccbillConfig || process.env.USE_MOCK_PAYMENTS === 'true';

    if (useMockPayments) {
      // Mock payment flow (for development/testing)
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
         (user_id, creator_id, subscription_id, amount_cents, transaction_type, status, payment_provider, payment_provider_transaction_id)
         VALUES ($1, $2, $3, $4, 'subscription', 'completed', 'mock', $5)
         RETURNING *`,
        [
          user.id,
          creatorId,
          subscription.id,
          priceCents,
          `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    } else {
      // CCBill payment flow
      // Create pending subscription first
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const subscriptionResult = await db.query(
        `INSERT INTO subscriptions 
         (fan_id, creator_id, tier_name, price_cents, status, started_at, expires_at, auto_renew)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, true)
         RETURNING *`,
        [user.id, creatorId, tierName || 'default', priceCents, now, expiresAt]
      );

      const subscription = subscriptionResult.rows[0];

      // Generate CCBill payment link
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     request.headers.get('origin') || 
                     'http://localhost:3000';

      const paymentLink = generateCCBillPaymentLink({
        subscriptionId: subscription.id,
        amountCents: priceCents,
        userId: user.id,
        creatorId,
        transactionType: 'subscription',
        returnUrl: `${baseUrl}/creators/${creatorId}?subscribed=true`,
        failureUrl: `${baseUrl}/creators/${creatorId}/subscribe?error=payment_failed`,
      });

      return NextResponse.json(
        {
          subscription: {
            id: subscription.id,
            creatorId: subscription.creator_id,
            status: subscription.status,
            expiresAt: subscription.expires_at,
          },
          paymentUrl: paymentLink,
          message: 'Payment required to complete subscription',
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Subscription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
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


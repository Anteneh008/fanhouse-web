import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCreatorEarnings } from '@/lib/ledger';
import db from '@/lib/db';

/**
 * Request a payout
 * POST /api/creators/payouts/request
 * 
 * Creators can request payouts of their pending earnings
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can request payouts' },
        { status: 403 }
      );
    }

    if (user.creatorStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Creator must be approved to request payouts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { amountCents, payoutMethod, payoutDetails } = body;

    // Validate amount
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid payout amount' },
        { status: 400 }
      );
    }

    // Minimum payout amount (e.g., $10)
    const MIN_PAYOUT_CENTS = 1000; // $10.00
    if (amountCents < MIN_PAYOUT_CENTS) {
      return NextResponse.json(
        { error: `Minimum payout amount is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}` },
        { status: 400 }
      );
    }

    // Validate payout method
    const validMethods = ['bank_transfer', 'paxum', 'skrill', 'crypto', 'other'];
    if (!payoutMethod || !validMethods.includes(payoutMethod)) {
      return NextResponse.json(
        { error: 'Invalid payout method' },
        { status: 400 }
      );
    }

    // Get creator's pending earnings
    const earnings = await getCreatorEarnings(user.id);

    if (earnings.pendingEarningsCents < amountCents) {
      return NextResponse.json(
        { 
          error: `Insufficient balance. Available: $${(earnings.pendingEarningsCents / 100).toFixed(2)}`,
          availableBalance: earnings.pendingEarningsCents
        },
        { status: 400 }
      );
    }

    // Check for existing pending payout
    const existingPayoutResult = await db.query(
      `SELECT id FROM payouts 
       WHERE creator_id = $1 AND status IN ('pending', 'processing')
       LIMIT 1`,
      [user.id]
    );

    if (existingPayoutResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending payout request' },
        { status: 400 }
      );
    }

    // Create payout request
    const payoutResult = await db.query(
      `INSERT INTO payouts 
       (creator_id, amount_cents, status, payout_method, payout_details)
       VALUES ($1, $2, 'pending', $3, $4)
       RETURNING *`,
      [
        user.id,
        amountCents,
        payoutMethod,
        payoutDetails ? JSON.stringify(payoutDetails) : null,
      ]
    );

    const payout = payoutResult.rows[0];

    return NextResponse.json(
      {
        payout: {
          id: payout.id,
          amountCents: payout.amount_cents,
          status: payout.status,
          payoutMethod: payout.payout_method,
          createdAt: payout.created_at,
        },
        message: 'Payout request submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Payout request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Get creator's payout history
 * GET /api/creators/payouts/request
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can view payouts' },
        { status: 403 }
      );
    }

    const payoutsResult = await db.query(
      `SELECT * FROM payouts
       WHERE creator_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.id]
    );

    const payouts = payoutsResult.rows.map((row) => ({
      id: row.id,
      amountCents: row.amount_cents,
      status: row.status,
      payoutMethod: row.payout_method,
      payoutDetails: row.payout_details,
      adminNotes: row.admin_notes,
      processedAt: row.processed_at,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ payouts });
  } catch (error) {
    console.error('Get payouts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


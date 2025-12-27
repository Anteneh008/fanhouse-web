import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateCCBillPaymentLink, getCCBillConfig } from '@/lib/ccbill';
import db from '@/lib/db';

/**
 * Generate CCBill payment link
 * POST /api/payments/ccbill/link
 * 
 * This endpoint generates a CCBill payment URL that the frontend
 * redirects the user to for payment processing.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const config = getCCBillConfig();

    if (!config) {
      return NextResponse.json(
        { error: 'Payment processing is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      creatorId,
      transactionType,
      amountCents,
      subscriptionId,
      postId,
    } = body;

    // Validate required fields
    if (!creatorId || !transactionType || !amountCents) {
      return NextResponse.json(
        { error: 'Missing required fields: creatorId, transactionType, amountCents' },
        { status: 400 }
      );
    }

    // Validate transaction type
    if (!['subscription', 'ppv', 'tip'].includes(transactionType)) {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amountCents < 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Verify creator exists and is approved
    if (transactionType === 'subscription' || transactionType === 'ppv') {
      const creatorResult = await db.query(
        `SELECT u.id, u.role, u.creator_status
         FROM users u
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
      if (creator.role !== 'creator' || creator.creator_status !== 'approved') {
        return NextResponse.json(
          { error: 'Creator is not approved' },
          { status: 400 }
        );
      }
    }

    // Build return URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   request.headers.get('origin') || 
                   'http://localhost:3000';

    let returnUrl = `${baseUrl}/payments/success`;
    let failureUrl = `${baseUrl}/payments/failure`;

    // Customize return URLs based on transaction type
    if (transactionType === 'subscription') {
      returnUrl = `${baseUrl}/creators/${creatorId}?subscribed=true`;
      failureUrl = `${baseUrl}/creators/${creatorId}/subscribe?error=payment_failed`;
    } else if (transactionType === 'ppv' && postId) {
      returnUrl = `${baseUrl}/posts/${postId}?unlocked=true`;
      failureUrl = `${baseUrl}/posts/${postId}?error=payment_failed`;
    }

    // Generate payment link
    const paymentLink = generateCCBillPaymentLink({
      subscriptionId,
      postId,
      amountCents,
      userId: user.id,
      creatorId,
      transactionType,
      returnUrl,
      failureUrl,
    });

    return NextResponse.json({
      paymentUrl: paymentLink,
      transactionType,
      amountCents,
    });
  } catch (error) {
    console.error('CCBill payment link error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


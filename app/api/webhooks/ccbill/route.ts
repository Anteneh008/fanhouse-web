import { NextRequest, NextResponse } from 'next/server';
import { verifyCCBillWebhook, parseCCBillWebhook, getCCBillConfig } from '@/lib/ccbill';
import db from '@/lib/db';

/**
 * CCBill Webhook Handler
 * POST /api/webhooks/ccbill
 * 
 * CCBill sends webhooks for payment events:
 * - subscription.created
 * - subscription.renewed
 * - subscription.canceled
 * - payment.completed
 * - payment.failed
 * - chargeback.created
 * 
 * This endpoint processes these events and updates our database.
 */
export async function POST(request: NextRequest) {
  try {
    const config = getCCBillConfig();
    if (!config) {
      console.error('CCBill webhook received but CCBill is not configured');
      return NextResponse.json(
        { error: 'CCBill not configured' },
        { status: 503 }
      );
    }

    // Get webhook signature from headers
    const signature = request.headers.get('x-ccbill-signature') || 
                     request.headers.get('ccbill-signature') || 
                     '';

    // Parse webhook payload
    // CCBill may send form-encoded or JSON - adjust based on their spec
    const contentType = request.headers.get('content-type') || '';
    let payload: Record<string, unknown>;

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      // Form-encoded data
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    }

    // Verify webhook signature
    // Note: CCBill's actual signature verification may differ - check their docs
    const isValid = verifyCCBillWebhook(
      payload as Parameters<typeof verifyCCBillWebhook>[0],
      signature
    );

    if (!isValid && process.env.NODE_ENV === 'production') {
      console.error('Invalid CCBill webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook event
    const event = parseCCBillWebhook(payload as Parameters<typeof parseCCBillWebhook>[0]);

    console.log('CCBill webhook received:', event);

    // Process event based on type
    switch (event.eventType) {
      case 'subscription.created':
      case 'subscription.renewed':
      case 'payment.completed':
        await handlePaymentCompleted(event);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event);
        break;

      case 'chargeback.created':
        await handleChargeback(event);
        break;

      default:
        console.warn('Unknown CCBill webhook event type:', event.eventType);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('CCBill webhook error:', error);
    // Return 200 to prevent CCBill from retrying
    // Log error for manual investigation
    return NextResponse.json({ received: true });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentCompleted(event: {
  subscriptionId?: string;
  transactionId: string;
  amountCents: number;
  status: string;
  metadata: Record<string, unknown>;
}) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Extract custom fields from metadata
    const userId = event.metadata.customUserId as string;
    const creatorId = event.metadata.customCreatorId as string;
    const transactionType = event.metadata.customTransactionType as string;

    if (!userId || !creatorId || !transactionType) {
      throw new Error('Missing required metadata in webhook');
    }

    // Create or update transaction
    const transactionResult = await client.query(
      `INSERT INTO transactions
       (user_id, creator_id, subscription_id, amount_cents, transaction_type, status, payment_provider, payment_provider_transaction_id)
       VALUES ($1, $2, $3, $4, $5, 'completed', 'ccbill', $6)
       ON CONFLICT (payment_provider_transaction_id) 
       DO UPDATE SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        creatorId,
        event.subscriptionId || null,
        event.amountCents,
        transactionType,
        event.transactionId,
      ]
    );

    const transaction = transactionResult.rows[0];

    // Handle based on transaction type
    if (transactionType === 'subscription') {
      // Create or update subscription
      if (event.subscriptionId) {
        // Update existing subscription
        await client.query(
          `UPDATE subscriptions
           SET status = 'active', 
               expires_at = CURRENT_TIMESTAMP + INTERVAL '30 days',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [event.subscriptionId]
        );
      } else {
        // Create new subscription
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await client.query(
          `INSERT INTO subscriptions
           (fan_id, creator_id, tier_name, price_cents, status, started_at, expires_at, auto_renew)
           VALUES ($1, $2, 'default', $3, 'active', CURRENT_TIMESTAMP, $4, true)
           ON CONFLICT (fan_id, creator_id) 
           DO UPDATE SET status = 'active', expires_at = $4, updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [userId, creatorId, event.amountCents, expiresAt]
        );
      }

      // Create ledger entry
      const platformFeeCents = Math.floor(event.amountCents * 0.2);
      const netAmountCents = event.amountCents - platformFeeCents;

      await client.query(
        `INSERT INTO ledger_entries
         (creator_id, entry_type, amount_cents, platform_fee_cents, net_amount_cents, description, transaction_id)
         VALUES ($1, 'earnings', $2, $3, $4, $5, $6)`,
        [
          creatorId,
          event.amountCents,
          platformFeeCents,
          netAmountCents,
          `Subscription payment - Transaction ${event.transactionId}`,
          transaction.id,
        ]
      );
    } else if (transactionType === 'ppv') {
      // Create PPV entitlement
      const postId = event.metadata.customPostId as string;
      if (postId) {
        await client.query(
          `INSERT INTO entitlements
           (user_id, post_id, creator_id, entitlement_type, transaction_id, purchased_at)
           VALUES ($1, $2, $3, 'ppv_purchase', $4, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, post_id, entitlement_type) DO NOTHING`,
          [userId, postId, creatorId, transaction.id]
        );

        // Create ledger entry
        const platformFeeCents = Math.floor(event.amountCents * 0.2);
        const netAmountCents = event.amountCents - platformFeeCents;

        await client.query(
          `INSERT INTO ledger_entries
           (creator_id, entry_type, amount_cents, platform_fee_cents, net_amount_cents, description, transaction_id)
           VALUES ($1, 'earnings', $2, $3, $4, $5, $6)`,
          [
            creatorId,
            event.amountCents,
            platformFeeCents,
            netAmountCents,
            `PPV purchase - Transaction ${event.transactionId}`,
            transaction.id,
          ]
        );
      }
    } else if (transactionType === 'tip') {
      // Create ledger entry for tip
      const platformFeeCents = Math.floor(event.amountCents * 0.2);
      const netAmountCents = event.amountCents - platformFeeCents;

      await client.query(
        `INSERT INTO ledger_entries
         (creator_id, entry_type, amount_cents, platform_fee_cents, net_amount_cents, description, transaction_id)
         VALUES ($1, 'earnings', $2, $3, $4, $5, $6)`,
        [
          creatorId,
          event.amountCents,
          platformFeeCents,
          netAmountCents,
          `Tip - Transaction ${event.transactionId}`,
          transaction.id,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(event: {
  subscriptionId?: string;
  transactionId: string;
  metadata: Record<string, unknown>;
}) {
  if (!event.subscriptionId) {
    return;
  }

  await db.query(
    `UPDATE subscriptions
     SET status = 'canceled',
         canceled_at = CURRENT_TIMESTAMP,
         auto_renew = false,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [event.subscriptionId]
  );
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(event: {
  transactionId: string;
  metadata: Record<string, unknown>;
}) {
  await db.query(
    `UPDATE transactions
     SET status = 'failed',
         updated_at = CURRENT_TIMESTAMP
     WHERE payment_provider_transaction_id = $1`,
    [event.transactionId]
  );
}

/**
 * Handle chargeback
 */
async function handleChargeback(event: {
  transactionId: string;
  amountCents: number;
  metadata: Record<string, unknown>;
}) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Update transaction status
    await client.query(
      `UPDATE transactions
       SET status = 'refunded',
           updated_at = CURRENT_TIMESTAMP
       WHERE payment_provider_transaction_id = $1`,
      [event.transactionId]
    );

    // Create refund ledger entry
    const transactionResult = await client.query(
      `SELECT creator_id, subscription_id FROM transactions
       WHERE payment_provider_transaction_id = $1`,
      [event.transactionId]
    );

    if (transactionResult.rows.length > 0) {
      const transaction = transactionResult.rows[0];
      
      await client.query(
        `INSERT INTO ledger_entries
         (creator_id, entry_type, amount_cents, platform_fee_cents, net_amount_cents, description, transaction_id)
         VALUES ($1, 'refund', $2, 0, $2, $3, (SELECT id FROM transactions WHERE payment_provider_transaction_id = $4))`,
        [
          transaction.creator_id,
          -event.amountCents, // Negative for refund
          `Chargeback - Transaction ${event.transactionId}`,
          event.transactionId,
        ]
      );

      // Cancel subscription if applicable
      if (transaction.subscription_id) {
        await client.query(
          `UPDATE subscriptions
           SET status = 'canceled',
               canceled_at = CURRENT_TIMESTAMP,
               auto_renew = false,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [transaction.subscription_id]
        );
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


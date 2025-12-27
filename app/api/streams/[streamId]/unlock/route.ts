import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import { grantEntitlement } from '@/lib/entitlements';
import { createLedgerEntry } from '@/lib/ledger';

/**
 * Unlock a PPV stream (mock payment)
 * POST /api/streams/[streamId]/unlock
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ streamId: string }> }
) {
  try {
    const user = await requireAuth();
    const { streamId } = await params;

    // Get stream details
    const streamResult = await db.query(
      'SELECT creator_id, visibility_type, price_cents, status FROM live_streams WHERE id = $1',
      [streamId]
    );

    if (streamResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    const stream = streamResult.rows[0];

    // Check if it's a PPV stream
    if (stream.visibility_type !== 'ppv') {
      return NextResponse.json(
        { error: 'This stream is not a PPV stream' },
        { status: 400 }
      );
    }

    // Check if user already has access
    const existingEntitlement = await db.query(
      'SELECT id FROM stream_entitlements WHERE stream_id = $1 AND user_id = $2',
      [streamId, user.id]
    );

    if (existingEntitlement.rows.length > 0) {
      return NextResponse.json(
        { error: 'You already have access to this stream' },
        { status: 400 }
      );
    }

    // Check if user is trying to unlock their own stream
    if (stream.creator_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot purchase your own stream' },
        { status: 400 }
      );
    }

    // Start transaction
    await db.query('BEGIN');

    try {
      // Create transaction record (mock payment - always succeeds)
      const transactionResult = await db.query(
        `INSERT INTO transactions 
         (user_id, creator_id, amount_cents, transaction_type, status, payment_provider)
         VALUES ($1, $2, $3, 'ppv', 'completed', 'mock')
         RETURNING id`,
        [user.id, stream.creator_id, stream.price_cents]
      );

      const transactionId = transactionResult.rows[0].id;

      // Grant stream entitlement
      await db.query(
        `INSERT INTO stream_entitlements (stream_id, user_id, entitlement_type, transaction_id)
         VALUES ($1, $2, 'ppv_purchase', $3)`,
        [streamId, user.id, transactionId]
      );

      // Create ledger entry for creator earnings
      await createLedgerEntry(
        stream.creator_id,
        stream.price_cents,
        'earnings',
        transactionId,
        `PPV stream purchase: Stream ${streamId}`
      );

      await db.query('COMMIT');

      return NextResponse.json({
        message: 'Stream unlocked successfully',
        transactionId,
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Unlock stream error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createLedgerEntry } from '@/lib/ledger';
import db from '@/lib/db';

/**
 * Process a payout (admin only)
 * POST /api/admin/payouts/[payoutId]/process
 * 
 * Admin marks payout as completed and creates ledger entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ payoutId: string }> }
) {
  try {
    const admin = await requireRole('admin');
    const { payoutId } = await params;

    const body = await request.json();
    const { action, adminNotes } = body; // action: 'approve' | 'reject' | 'cancel'

    // Get payout
    const payoutResult = await db.query(
      `SELECT * FROM payouts WHERE id = $1`,
      [payoutId]
    );

    if (payoutResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Payout not found' },
        { status: 404 }
      );
    }

    const payout = payoutResult.rows[0];

    if (payout.status !== 'pending' && payout.status !== 'processing') {
      return NextResponse.json(
        { error: `Cannot process payout with status: ${payout.status}` },
        { status: 400 }
      );
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      if (action === 'approve' || action === 'complete') {
        // Create ledger entry for payout (negative amount)
        const ledgerEntryId = await createLedgerEntry(
          payout.creator_id,
          -payout.amount_cents, // Negative for payout
          'payout',
          undefined,
          `Payout processed - ${payout.payout_method}`
        );

        // Update payout status
        await client.query(
          `UPDATE payouts
           SET status = 'completed',
               processed_by = $1,
               processed_at = CURRENT_TIMESTAMP,
               admin_notes = $2,
               ledger_entry_id = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [
            admin.id,
            adminNotes || null,
            ledgerEntryId,
            payoutId,
          ]
        );
      } else if (action === 'reject' || action === 'fail') {
        // Update payout status to failed
        await client.query(
          `UPDATE payouts
           SET status = 'failed',
               processed_by = $1,
               processed_at = CURRENT_TIMESTAMP,
               admin_notes = $2,
               failure_reason = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [
            admin.id,
            adminNotes || null,
            body.failureReason || 'Rejected by admin',
            payoutId,
          ]
        );
      } else if (action === 'cancel') {
        // Update payout status to cancelled
        await client.query(
          `UPDATE payouts
           SET status = 'cancelled',
               processed_by = $1,
               processed_at = CURRENT_TIMESTAMP,
               admin_notes = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [
            admin.id,
            adminNotes || null,
            payoutId,
          ]
        );
      } else {
        throw new Error('Invalid action');
      }

      await client.query('COMMIT');

      return NextResponse.json({
        message: `Payout ${action === 'approve' || action === 'complete' ? 'completed' : action}d successfully`,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Process payout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


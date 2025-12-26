import db from './db';
import { calculatePlatformFee, calculateNetAmount } from './entitlements';

/**
 * Create a ledger entry (append-only)
 * This is the source of truth for creator earnings
 */
export async function createLedgerEntry(
  creatorId: string,
  amountCents: number,
  entryType: 'earnings' | 'payout' | 'refund' | 'adjustment',
  transactionId?: string,
  description?: string
): Promise<string> {
  const platformFeeCents = entryType === 'earnings' ? calculatePlatformFee(amountCents) : 0;
  const netAmountCents = entryType === 'earnings' ? calculateNetAmount(amountCents) : amountCents;

  const result = await db.query(
    `INSERT INTO ledger_entries 
     (creator_id, transaction_id, amount_cents, platform_fee_cents, net_amount_cents, description, entry_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      creatorId,
      transactionId || null,
      amountCents,
      platformFeeCents,
      netAmountCents,
      description || null,
      entryType,
    ]
  );

  return result.rows[0].id;
}

/**
 * Get creator earnings summary
 * Calculated from ledger entries (append-only, no balance updates)
 */
export async function getCreatorEarnings(creatorId: string): Promise<{
  totalEarningsCents: number;
  totalPayoutsCents: number;
  pendingEarningsCents: number;
}> {
  const result = await db.query(
    'SELECT * FROM get_creator_earnings($1)',
    [creatorId]
  );

  if (result.rows.length === 0) {
    return {
      totalEarningsCents: 0,
      totalPayoutsCents: 0,
      pendingEarningsCents: 0,
    };
  }

  return {
    totalEarningsCents: Number(result.rows[0].total_earnings_cents),
    totalPayoutsCents: Number(result.rows[0].total_payouts_cents),
    pendingEarningsCents: Number(result.rows[0].pending_earnings_cents),
  };
}

/**
 * Get ledger entries for a creator
 */
export async function getCreatorLedger(
  creatorId: string,
  limit: number = 50,
  offset: number = 0
) {
  const result = await db.query(
    `SELECT * FROM ledger_entries 
     WHERE creator_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [creatorId, limit, offset]
  );

  return result.rows;
}


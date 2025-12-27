import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Get all payout requests (admin only)
 * GET /api/admin/payouts
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole('admin');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    let query = `
      SELECT 
        p.*,
        u.email as creator_email,
        cp.display_name as creator_display_name,
        admin_user.email as processed_by_email
      FROM payouts p
      INNER JOIN users u ON p.creator_id = u.id
      LEFT JOIN creator_profiles cp ON p.creator_id = cp.user_id
      LEFT JOIN users admin_user ON p.processed_by = admin_user.id
    `;

    const params: string[] = [];

    if (status !== 'all') {
      query += ` WHERE p.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC LIMIT 100`;

    const payoutsResult = await db.query(query, params);

    const payouts = payoutsResult.rows.map((row) => ({
      id: row.id,
      creatorId: row.creator_id,
      creatorEmail: row.creator_email,
      creatorDisplayName: row.creator_display_name,
      amountCents: row.amount_cents,
      status: row.status,
      payoutMethod: row.payout_method,
      payoutDetails: row.payout_details,
      adminNotes: row.admin_notes,
      processedBy: row.processed_by_email,
      processedAt: row.processed_at,
      failureReason: row.failure_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Get stats
    const statsResult = await db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        SUM(amount_cents) FILTER (WHERE status = 'pending') as pending_amount_cents,
        SUM(amount_cents) FILTER (WHERE status = 'completed') as completed_amount_cents
      FROM payouts`
    );

    const stats = {
      pending: parseInt(statsResult.rows[0]?.pending || '0'),
      processing: parseInt(statsResult.rows[0]?.processing || '0'),
      completed: parseInt(statsResult.rows[0]?.completed || '0'),
      failed: parseInt(statsResult.rows[0]?.failed || '0'),
      pendingAmountCents: parseInt(statsResult.rows[0]?.pending_amount_cents || '0'),
      completedAmountCents: parseInt(statsResult.rows[0]?.completed_amount_cents || '0'),
    };

    return NextResponse.json({ payouts, stats });
  } catch (error) {
    console.error('Get payouts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


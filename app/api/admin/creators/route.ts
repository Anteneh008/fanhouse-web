import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Get all creators (admin only)
 * GET /api/admin/creators
 */
export async function GET() {
  try {
    await requireRole('admin');

    const result = await db.query(
      `SELECT 
        u.id,
        u.email,
        u.role,
        u.creator_status,
        u.created_at,
        cp.display_name,
        cp.bio,
        cp.subscription_price_cents,
        cp.is_free_profile,
        kyc.status as kyc_status,
        kyc.rejection_reason
      FROM users u
      LEFT JOIN creator_profiles cp ON u.id = cp.user_id
      LEFT JOIN kyc_verifications kyc ON u.id = kyc.user_id AND kyc.verification_type = 'kyc'
      WHERE u.role = 'creator'
      ORDER BY u.created_at DESC`
    );

    return NextResponse.json({ creators: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied';
    const status = message === 'Unauthorized' ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}


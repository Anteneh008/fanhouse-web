import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Get creator application status
 * GET /api/creators/status
 */
export async function GET() {
  try {
    const user = await requireAuth();

    // Get user's current status
    const userResult = await db.query(
      'SELECT role, creator_status FROM users WHERE id = $1',
      [user.id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { role, creator_status } = userResult.rows[0];

    // Get creator profile if exists
    let profile = null;
    if (role === 'creator') {
      const profileResult = await db.query(
        'SELECT * FROM creator_profiles WHERE user_id = $1',
        [user.id]
      );
      profile = profileResult.rows[0] || null;
    }

    // Get KYC verification status
    let kycStatus = null;
    const kycResult = await db.query(
      'SELECT status, rejection_reason FROM kyc_verifications WHERE user_id = $1 AND verification_type = $2',
      [user.id, 'kyc']
    );
    kycStatus = kycResult.rows[0] || null;

    return NextResponse.json({
      role,
      creatorStatus: creator_status,
      profile,
      kyc: kycStatus ? {
        status: kycStatus.status,
        rejectionReason: kycStatus.rejection_reason,
      } : null,
    });
  } catch (error) {
    console.error('Get creator status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


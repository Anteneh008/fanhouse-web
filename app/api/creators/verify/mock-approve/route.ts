import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Mock approval endpoint for development
 * POST /api/creators/verify/mock-approve
 * 
 * This endpoint auto-approves KYC verification for development/testing
 * Should be disabled in production
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Not available in production' },
        { status: 403 }
      );
    }

    const user = await requireAuth();

    if (user.role !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can use this endpoint' },
        { status: 403 }
      );
    }

    // Get pending verification
    const verificationResult = await db.query(
      'SELECT * FROM kyc_verifications WHERE user_id = $1 AND verification_type = $2',
      [user.id, 'kyc']
    );

    if (verificationResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No verification found. Please start verification first.' },
        { status: 404 }
      );
    }

    const verification = verificationResult.rows[0];

    if (verification.status === 'approved') {
      return NextResponse.json({
        message: 'Verification already approved',
        status: 'approved',
      });
    }

    // Approve verification
    await db.query(
      `UPDATE kyc_verifications 
       SET 
         status = 'approved',
         verified_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND verification_type = $2`,
      [user.id, 'kyc']
    );

    // Update user's creator status to approved
    await db.query(
      "UPDATE users SET creator_status = 'approved' WHERE id = $1",
      [user.id]
    );

    return NextResponse.json({
      message: 'Verification approved (mock)',
      status: 'approved',
    });
  } catch (error) {
    console.error('Mock approve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import db from '@/lib/db';
import { notifyCreatorRejected } from '@/lib/knock';

/**
 * Reject a creator (admin only)
 * POST /api/admin/creators/[userId]/reject
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireRole('admin');
    const { userId } = await params;

    const body = await request.json();
    const { reason } = body;

    // Verify user exists and is a creator
    const userResult = await db.query(
      'SELECT role, creator_status FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];
    if (user.role !== 'creator') {
      return NextResponse.json(
        { error: 'User is not a creator' },
        { status: 400 }
      );
    }

    // Update user status to rejected
    await db.query(
      `UPDATE users 
       SET creator_status = 'rejected'
       WHERE id = $1`,
      [userId]
    );

    // Update KYC verification status
    await db.query(
      `UPDATE kyc_verifications
       SET status = 'rejected',
           rejection_reason = $2
       WHERE user_id = $1 AND verification_type = 'kyc'`,
      [userId, reason || 'Application rejected by admin']
    );

    // Send notification to creator (async, don't wait)
    notifyCreatorRejected(userId, reason || undefined).catch((error) => {
      console.error('Failed to send notification:', error);
    });

    return NextResponse.json({
      message: 'Creator rejected',
      userId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied';
    const status = message === 'Unauthorized' ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}


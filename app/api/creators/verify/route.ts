import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import { createInquiry } from '@/lib/persona';

/**
 * Start KYC verification for a creator
 * POST /api/creators/verify
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Only creators can verify
    if (user.role !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can start verification' },
        { status: 403 }
      );
    }

    // Check if verification already exists
    const existingVerification = await db.query(
      'SELECT * FROM kyc_verifications WHERE user_id = $1 AND verification_type = $2',
      [user.id, 'kyc']
    );

    if (existingVerification.rows.length > 0) {
      const verification = existingVerification.rows[0];
      
      // If already approved, return success
      if (verification.status === 'approved') {
        return NextResponse.json({
          inquiryId: verification.persona_inquiry_id,
          status: verification.status,
          message: 'Verification already completed',
        });
      }

      // If pending, return existing inquiry
      if (verification.status === 'pending') {
        return NextResponse.json({
          inquiryId: verification.persona_inquiry_id,
          status: verification.status,
          message: 'Verification already in progress',
        });
      }
    }

    // Create Persona inquiry
    const { inquiryId, clientToken } = await createInquiry(user.id, user.email);

    // Store verification record
    await db.query(
      `INSERT INTO kyc_verifications 
       (user_id, persona_inquiry_id, status, verification_type)
       VALUES ($1, $2, 'pending', 'kyc')
       ON CONFLICT (user_id, verification_type) 
       DO UPDATE SET 
         persona_inquiry_id = $2,
         status = 'pending',
         updated_at = CURRENT_TIMESTAMP`,
      [user.id, inquiryId]
    );

    return NextResponse.json({
      inquiryId,
      clientToken,
      status: 'pending',
      message: 'Verification started successfully',
    });
  } catch (error) {
    console.error('Start verification error:', error);
    return NextResponse.json(
      { error: 'Failed to start verification' },
      { status: 500 }
    );
  }
}

/**
 * Get verification status
 * GET /api/creators/verify
 */
export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can check verification status' },
        { status: 403 }
      );
    }

    const verificationResult = await db.query(
      'SELECT * FROM kyc_verifications WHERE user_id = $1 AND verification_type = $2',
      [user.id, 'kyc']
    );

    if (verificationResult.rows.length === 0) {
      return NextResponse.json({
        status: 'not_started',
        message: 'Verification not started',
      });
    }

    const verification = verificationResult.rows[0];

    return NextResponse.json({
      inquiryId: verification.persona_inquiry_id,
      status: verification.status,
      riskLevel: verification.risk_level,
      rejectionReason: verification.rejection_reason,
      verifiedAt: verification.verified_at,
      expiresAt: verification.expires_at,
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyWebhookSignature, processWebhook } from '@/lib/persona';

/**
 * Persona webhook handler
 * POST /api/webhooks/persona
 * 
 * This endpoint receives webhooks from Persona when verification status changes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('persona-signature') || '';

    // Verify webhook signature (in production)
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid Persona webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhook = JSON.parse(body);
    const { inquiryId, status, completedAt } = processWebhook(webhook);

    // Find user by inquiry ID
    const verificationResult = await db.query(
      'SELECT user_id FROM kyc_verifications WHERE persona_inquiry_id = $1',
      [inquiryId]
    );

    if (verificationResult.rows.length === 0) {
      console.error(`No verification found for inquiry ${inquiryId}`);
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    const userId = verificationResult.rows[0].user_id;

    // Map Persona status to our status
    let ourStatus: string;
    switch (status) {
      case 'completed':
      case 'approved':
        ourStatus = 'approved';
        break;
      case 'failed':
      case 'declined':
        ourStatus = 'rejected';
        break;
      case 'expired':
        ourStatus = 'expired';
        break;
      default:
        ourStatus = 'pending';
    }

    // Update verification status
    await db.query(
      `UPDATE kyc_verifications 
       SET 
         status = $1,
         persona_webhook_data = $2,
         verified_at = CASE WHEN $1 = 'approved' THEN COALESCE($3::timestamp, CURRENT_TIMESTAMP) ELSE verified_at END,
         updated_at = CURRENT_TIMESTAMP
       WHERE persona_inquiry_id = $4`,
      [
        ourStatus,
        JSON.stringify(webhook),
        completedAt || null,
        inquiryId,
      ]
    );

    // If approved, update user's creator status to approved
    if (ourStatus === 'approved') {
      await db.query(
        "UPDATE users SET creator_status = 'approved' WHERE id = $1",
        [userId]
      );
    }

    console.log(`Updated verification ${inquiryId} to status ${ourStatus} for user ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Persona webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}


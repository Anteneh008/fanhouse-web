import { NextRequest, NextResponse } from 'next/server';
import { verifyKnockWebhookSignature } from '@/lib/knock';
import db from '@/lib/db';

/**
 * Knock Webhook Handler
 * POST /api/webhooks/knock
 * 
 * Knock sends webhooks for various events:
 * - workflow.run.completed
 * - workflow.run.failed
 * - channel_item.sent
 * - channel_item.failed
 * 
 * This endpoint processes these events and updates our database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('knock-signature') || '';

    // Verify webhook signature
    if (!verifyKnockWebhookSignature(body, signature)) {
      console.error('Invalid Knock webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhook = JSON.parse(body);
    console.log('Knock webhook received:', webhook);

    // Handle different webhook event types
    switch (webhook.event) {
      case 'workflow.run.completed':
        await handleWorkflowCompleted(webhook);
        break;

      case 'workflow.run.failed':
        await handleWorkflowFailed(webhook);
        break;

      case 'channel_item.sent':
        await handleChannelItemSent(webhook);
        break;

      case 'channel_item.failed':
        await handleChannelItemFailed(webhook);
        break;

      default:
        console.warn('Unknown Knock webhook event:', webhook.event);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Knock webhook error:', error);
    // Return 200 to prevent Knock from retrying
    // Log error for manual investigation
    return NextResponse.json({ received: true });
  }
}

/**
 * Handle workflow completion
 */
async function handleWorkflowCompleted(webhook: {
  data: {
    workflow_run_id: string;
    workflow_id: string;
    recipient: { id: string };
  };
}) {
  const { workflow_run_id, workflow_id, recipient } = webhook.data;

  // Update notification with Knock workflow ID if not already set
  await db.query(
    `UPDATE notifications
     SET knock_workflow_id = $1
     WHERE user_id = $2 AND knock_workflow_id IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [workflow_run_id, recipient.id]
  );

  console.log(`Workflow ${workflow_id} completed for user ${recipient.id}`);
}

/**
 * Handle workflow failure
 */
async function handleWorkflowFailed(webhook: {
  data: {
    workflow_run_id: string;
    workflow_id: string;
    recipient: { id: string };
    error?: string;
  };
}) {
  const { workflow_id, recipient, error } = webhook.data;
  console.error(
    `Workflow ${workflow_id} failed for user ${recipient.id}:`,
    error
  );
  // Could store failure in database for retry logic
}

/**
 * Handle channel item sent (email, SMS, etc.)
 */
async function handleChannelItemSent(webhook: {
  data: {
    channel_id: string;
    workflow_run_id: string;
    recipient: { id: string };
  };
}) {
  const { channel_id, workflow_run_id, recipient } = webhook.data;
  console.log(
    `Channel ${channel_id} item sent for workflow ${workflow_run_id} to user ${recipient.id}`
  );
  // Could track delivery status in database
}

/**
 * Handle channel item failure
 */
async function handleChannelItemFailed(webhook: {
  data: {
    channel_id: string;
    workflow_run_id: string;
    recipient: { id: string };
    error?: string;
  };
}) {
  const { channel_id, workflow_run_id, recipient, error } = webhook.data;
  console.error(
    `Channel ${channel_id} item failed for workflow ${workflow_run_id} to user ${recipient.id}:`,
    error
  );
  // Could store failure for retry or alerting
}


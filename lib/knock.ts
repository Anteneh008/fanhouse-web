/**
 * Knock.app Integration
 * 
 * Knock is the notification orchestration layer for FanHouse.
 * It handles in-app notifications, email notifications, and can be extended
 * to support SMS, push notifications, etc.
 * 
 * Documentation: https://docs.knock.app
 */

import { Knock } from '@knocklabs/node';

// Knock configuration
const KNOCK_API_KEY = process.env.KNOCK_API_KEY;
const KNOCK_SIGNING_KEY = process.env.KNOCK_SIGNING_KEY;
const USE_MOCK = !KNOCK_API_KEY || process.env.NODE_ENV === 'development';

// Initialize Knock client (or null if not configured)
let knockClient: Knock | null = null;

if (KNOCK_API_KEY && !USE_MOCK) {
  knockClient = new Knock(KNOCK_API_KEY);
}

/**
 * Notification types supported by FanHouse
 */
export type NotificationType =
  | 'new_message'
  | 'new_post'
  | 'subscription_renewed'
  | 'payment_received'
  | 'new_follower'
  | 'new_comment'
  | 'new_like'
  | 'creator_approved'
  | 'creator_rejected'
  | 'payout_processed'
  | 'admin_action';

/**
 * Notification channel preferences
 */
export interface NotificationPreferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  [key: string]: boolean; // For type-specific preferences
}

/**
 * Notification data payload
 */
export interface NotificationData {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  // Optional related entity IDs
  relatedUserId?: string;
  relatedPostId?: string;
  relatedMessageId?: string;
  relatedTransactionId?: string;
  // Additional metadata
  metadata?: Record<string, unknown>;
}

/**
 * Check if Knock is configured
 */
export function isKnockConfigured(): boolean {
  return knockClient !== null;
}

/**
 * Send a notification via Knock
 * 
 * This function:
 * 1. Checks user notification preferences
 * 2. Sends notification through Knock
 * 3. Stores notification in database
 * 4. Returns notification ID
 */
export async function sendNotification(
  data: NotificationData
): Promise<{ notificationId: string; knockId?: string }> {
  if (USE_MOCK || !knockClient) {
    // Mock mode - just log and return mock ID
    console.log('[MOCK] Sending notification:', data);
    return {
      notificationId: `notif_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  try {
    // Get user notification preferences
    const preferences = await getUserNotificationPreferences(data.userId);
    
    // Determine which channels to use
    const channels: string[] = [];
    if (preferences.inAppEnabled && preferences[`${data.type}_enabled`] !== false) {
      channels.push('in_app');
    }
    if (preferences.emailEnabled && preferences[`${data.type}_email_enabled`] !== false) {
      channels.push('email');
    }

    if (channels.length === 0) {
      console.log(`User ${data.userId} has disabled notifications for type ${data.type}`);
      // Still store in database but don't send
      const notificationId = await storeNotificationInDatabase(data, null);
      return { notificationId };
    }

    // Prepare Knock notification payload
    const knockData: Record<string, unknown> = {
      title: data.title,
      message: data.message,
      notification_type: data.type,
      ...data.metadata,
    };

    // Add related entity IDs if present
    if (data.relatedUserId) knockData.related_user_id = data.relatedUserId;
    if (data.relatedPostId) knockData.related_post_id = data.relatedPostId;
    if (data.relatedMessageId) knockData.related_message_id = data.relatedMessageId;
    if (data.relatedTransactionId) knockData.related_transaction_id = data.relatedTransactionId;

    // Send notification via Knock
    const result = await knockClient!.notify(data.type, {
      recipients: [data.userId],
      data: knockData,
      channels: channels,
    });

    // Store notification in database
    const notificationId = await storeNotificationInDatabase(
      data,
      result.workflow_run_id || undefined
    );

    return {
      notificationId,
      knockId: result.workflow_run_id,
    };
  } catch (error) {
    console.error('Knock notification error:', error);
    // Still store in database even if Knock fails
    const notificationId = await storeNotificationInDatabase(data, null);
    return { notificationId };
  }
}

/**
 * Get user notification preferences
 */
async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const db = (await import('./db')).default;
  
  const result = await db.query(
    `SELECT * FROM notification_preferences WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    // Return default preferences
    return {
      emailEnabled: true,
      inAppEnabled: true,
      new_message_enabled: true,
      new_message_email_enabled: true,
      new_post_enabled: true,
      new_post_email_enabled: true,
      subscription_renewed_enabled: true,
      subscription_renewed_email_enabled: true,
      payment_received_enabled: true,
      payment_received_email_enabled: true,
      new_follower_enabled: true,
      new_follower_email_enabled: true,
      new_comment_enabled: true,
      new_comment_email_enabled: true,
      new_like_enabled: true,
      new_like_email_enabled: true,
    };
  }

  const row = result.rows[0];
  return {
    emailEnabled: row.email_enabled ?? true,
    inAppEnabled: row.in_app_enabled ?? true,
    new_message_enabled: row.new_message_enabled ?? true,
    new_message_email_enabled: row.new_message_email_enabled ?? true,
    new_post_enabled: row.new_post_enabled ?? true,
    new_post_email_enabled: row.new_post_email_enabled ?? true,
    subscription_renewed_enabled: row.subscription_renewed_enabled ?? true,
    subscription_renewed_email_enabled: row.subscription_renewed_email_enabled ?? true,
    payment_received_enabled: row.payment_received_enabled ?? true,
    payment_received_email_enabled: row.payment_received_email_enabled ?? true,
    new_follower_enabled: row.new_follower_enabled ?? true,
    new_follower_email_enabled: row.new_follower_email_enabled ?? true,
    new_comment_enabled: row.new_comment_enabled ?? true,
    new_comment_email_enabled: row.new_comment_email_enabled ?? true,
    new_like_enabled: row.new_like_enabled ?? true,
    new_like_email_enabled: row.new_like_email_enabled ?? true,
  };
}

/**
 * Store notification in database
 */
async function storeNotificationInDatabase(
  data: NotificationData,
  knockWorkflowId: string | null
): Promise<string> {
  const db = (await import('./db')).default;

  const result = await db.query(
    `INSERT INTO notifications
     (user_id, notification_type, title, message, related_user_id, related_post_id, 
      related_message_id, related_transaction_id, knock_workflow_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      data.userId,
      data.type,
      data.title,
      data.message,
      data.relatedUserId || null,
      data.relatedPostId || null,
      data.relatedMessageId || null,
      data.relatedTransactionId || null,
      knockWorkflowId,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );

  return result.rows[0].id;
}

/**
 * Verify Knock webhook signature
 */
export function verifyKnockWebhookSignature(
  body: string,
  signature: string
): boolean {
  if (USE_MOCK || !KNOCK_SIGNING_KEY) {
    // In mock mode or without signing key, accept all
    return true;
  }

  // Knock uses HMAC SHA256 for webhook signatures
  // Format: timestamp,body_hash
  const crypto = require('crypto');
  
  try {
    const [timestamp, hash] = signature.split(',');
    const expectedHash = crypto
      .createHmac('sha256', KNOCK_SIGNING_KEY)
      .update(`${timestamp}.${body}`)
      .digest('hex');
    
    return hash === expectedHash;
  } catch (error) {
    console.error('Knock webhook signature verification error:', error);
    return false;
  }
}

/**
 * Helper functions to send specific notification types
 */

export async function notifyNewMessage(
  recipientId: string,
  senderId: string,
  messageId: string,
  senderName: string
): Promise<void> {
  await sendNotification({
    type: 'new_message',
    userId: recipientId,
    title: 'New Message',
    message: `You have a new message from ${senderName}`,
    relatedUserId: senderId,
    relatedMessageId: messageId,
    metadata: {
      sender_name: senderName,
    },
  });
}

export async function notifyNewPost(
  userId: string,
  creatorId: string,
  postId: string,
  creatorName: string
): Promise<void> {
  await sendNotification({
    type: 'new_post',
    userId,
    title: 'New Post',
    message: `${creatorName} posted new content`,
    relatedUserId: creatorId,
    relatedPostId: postId,
    metadata: {
      creator_name: creatorName,
    },
  });
}

export async function notifySubscriptionRenewed(
  userId: string,
  creatorId: string,
  subscriptionId: string
): Promise<void> {
  await sendNotification({
    type: 'subscription_renewed',
    userId,
    title: 'Subscription Renewed',
    message: 'Your subscription has been renewed',
    relatedUserId: creatorId,
    metadata: {
      subscription_id: subscriptionId,
    },
  });
}

export async function notifyPaymentReceived(
  creatorId: string,
  transactionId: string,
  amountCents: number,
  transactionType: 'subscription' | 'ppv' | 'tip'
): Promise<void> {
  const typeLabels = {
    subscription: 'Subscription',
    ppv: 'PPV Purchase',
    tip: 'Tip',
  };

  await sendNotification({
    type: 'payment_received',
    userId: creatorId,
    title: 'Payment Received',
    message: `You received a ${typeLabels[transactionType]} payment of $${(amountCents / 100).toFixed(2)}`,
    relatedTransactionId: transactionId,
    metadata: {
      amount_cents: amountCents,
      transaction_type: transactionType,
    },
  });
}

export async function notifyNewComment(
  creatorId: string,
  postId: string,
  commenterId: string,
  commenterName: string
): Promise<void> {
  await sendNotification({
    type: 'new_comment',
    userId: creatorId,
    title: 'New Comment',
    message: `${commenterName} commented on your post`,
    relatedUserId: commenterId,
    relatedPostId: postId,
    metadata: {
      commenter_name: commenterName,
    },
  });
}

export async function notifyNewLike(
  creatorId: string,
  postId: string,
  likerId: string,
  likerName: string
): Promise<void> {
  await sendNotification({
    type: 'new_like',
    userId: creatorId,
    title: 'New Like',
    message: `${likerName} liked your post`,
    relatedUserId: likerId,
    relatedPostId: postId,
    metadata: {
      liker_name: likerName,
    },
  });
}

export async function notifyCreatorApproved(userId: string): Promise<void> {
  await sendNotification({
    type: 'creator_approved',
    userId,
    title: 'Creator Application Approved',
    message: 'Your creator application has been approved! You can now start creating content.',
  });
}

export async function notifyCreatorRejected(
  userId: string,
  reason?: string
): Promise<void> {
  await sendNotification({
    type: 'creator_rejected',
    userId,
    title: 'Creator Application Rejected',
    message: reason
      ? `Your creator application was rejected: ${reason}`
      : 'Your creator application was rejected. Please contact support for more information.',
    metadata: {
      rejection_reason: reason,
    },
  });
}


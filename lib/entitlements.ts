import db from './db';
import { SafeUser } from './types';

const PLATFORM_FEE_PERCENT = 20; // 20% platform fee

/**
 * Check if a user has access to a post
 * Returns true if user can view the post, false otherwise
 */
export async function hasPostAccess(
  userId: string,
  postId: string
): Promise<boolean> {
  // Get post details
  const postResult = await db.query(
    'SELECT creator_id, visibility_type, price_cents FROM posts WHERE id = $1 AND is_disabled = false',
    [postId]
  );

  if (postResult.rows.length === 0) {
    return false; // Post doesn't exist or is disabled
  }

  const post = postResult.rows[0];

  // Free posts are accessible to everyone
  if (post.visibility_type === 'free') {
    return true;
  }

  // Check if user is the creator (creators can always see their own posts)
  if (post.creator_id === userId) {
    return true;
  }

  // Check entitlements
  const entitlementResult = await db.query(
    `SELECT id FROM entitlements 
     WHERE user_id = $1 
     AND post_id = $2 
     AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
    [userId, postId]
  );

  if (entitlementResult.rows.length > 0) {
    return true; // User has entitlement
  }

  // For subscriber posts, check active subscription
  if (post.visibility_type === 'subscriber') {
    const subscriptionResult = await db.query(
      `SELECT id FROM subscriptions 
       WHERE fan_id = $1 
       AND creator_id = $2 
       AND status = 'active' 
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
      [userId, post.creator_id]
    );

    if (subscriptionResult.rows.length > 0) {
      return true; // User has active subscription
    }
  }

  // For PPV posts, user must have purchased it
  if (post.visibility_type === 'ppv') {
    // Already checked entitlements above
    return false;
  }

  return false;
}

/**
 * Check if user has active subscription to creator
 */
export async function hasActiveSubscription(
  fanId: string,
  creatorId: string
): Promise<boolean> {
  const result = await db.query(
    `SELECT id FROM subscriptions 
     WHERE fan_id = $1 
     AND creator_id = $2 
     AND status = 'active' 
     AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
    [fanId, creatorId]
  );

  return result.rows.length > 0;
}

/**
 * Grant entitlement to user for a post
 */
export async function grantEntitlement(
  userId: string,
  postId: string,
  entitlementType: 'subscription' | 'ppv_purchase' | 'tip',
  subscriptionId?: string,
  transactionId?: string,
  expiresAt?: Date
): Promise<string> {
  // Get post creator_id
  const postResult = await db.query(
    'SELECT creator_id FROM posts WHERE id = $1',
    [postId]
  );

  if (postResult.rows.length === 0) {
    throw new Error('Post not found');
  }

  const creatorId = postResult.rows[0].creator_id;

  const result = await db.query(
    `INSERT INTO entitlements 
     (user_id, post_id, creator_id, entitlement_type, subscription_id, transaction_id, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, post_id, entitlement_type) DO NOTHING
     RETURNING id`,
    [userId, postId, creatorId, entitlementType, subscriptionId || null, transactionId || null, expiresAt || null]
  );

  if (result.rows.length === 0) {
    // Entitlement already exists
    const existing = await db.query(
      'SELECT id FROM entitlements WHERE user_id = $1 AND post_id = $2 AND entitlement_type = $3',
      [userId, postId, entitlementType]
    );
    return existing.rows[0].id;
  }

  return result.rows[0].id;
}

/**
 * Get platform fee amount
 */
export function calculatePlatformFee(amountCents: number): number {
  return Math.floor(amountCents * (PLATFORM_FEE_PERCENT / 100));
}

/**
 * Calculate net amount to creator (after platform fee)
 */
export function calculateNetAmount(amountCents: number): number {
  return amountCents - calculatePlatformFee(amountCents);
}


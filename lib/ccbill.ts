/**
 * CCBill Payment Integration
 * 
 * CCBill is the payment processor for NSFW/adult content platforms.
 * This module handles:
 * - Payment link generation for subscriptions, PPV, and tips
 * - Webhook signature verification
 * - Payment status handling
 * 
 * Documentation: https://support.ccbill.com/
 */

import crypto from 'crypto';

export interface CCBillConfig {
  clientAccountNumber: string;
  subaccountNumber: string;
  salt: string; // For payment link generation
  webhookSecret: string; // For webhook verification
  flexFormsId?: string; // Optional: for custom payment forms
  currencyCode?: string; // Default: 840 (USD)
}

export interface CCBillPaymentLinkParams {
  subscriptionId?: string;
  postId?: string; // For PPV
  amountCents: number;
  userId: string;
  creatorId: string;
  transactionType: 'subscription' | 'ppv' | 'tip';
  returnUrl: string; // Where to redirect after payment
  failureUrl: string; // Where to redirect on failure
  customData?: Record<string, string>; // Additional metadata
}

export interface CCBillWebhookPayload {
  eventType: string;
  subscriptionId?: string;
  transactionId: string;
  amount: string;
  currency: string;
  status: string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Get CCBill configuration from environment variables
 */
export function getCCBillConfig(): CCBillConfig | null {
  const clientAccountNumber = process.env.CCBILL_CLIENT_ACCOUNT_NUMBER;
  const subaccountNumber = process.env.CCBILL_SUBACCOUNT_NUMBER;
  const salt = process.env.CCBILL_SALT;
  const webhookSecret = process.env.CCBILL_WEBHOOK_SECRET;

  if (!clientAccountNumber || !subaccountNumber || !salt || !webhookSecret) {
    console.warn('CCBill configuration incomplete - payment features disabled');
    return null;
  }

  return {
    clientAccountNumber,
    subaccountNumber,
    salt,
    webhookSecret,
    flexFormsId: process.env.CCBILL_FLEXFORMS_ID,
    currencyCode: process.env.CCBILL_CURRENCY_CODE || '840', // 840 = USD
  };
}

/**
 * Generate CCBill payment link for subscriptions
 * 
 * CCBill uses a "FlexForms" system where you generate a payment link
 * with parameters that CCBill uses to process the payment.
 * 
 * @param params Payment parameters
 * @returns CCBill payment URL
 */
export function generateCCBillPaymentLink(
  params: CCBillPaymentLinkParams
): string {
  const config = getCCBillConfig();
  if (!config) {
    throw new Error('CCBill is not configured');
  }

  const {
    subscriptionId,
    postId,
    amountCents,
    userId,
    creatorId,
    transactionType,
    returnUrl,
    failureUrl,
    customData = {},
  } = params;

  // Convert cents to dollars (CCBill uses dollars)
  const amount = (amountCents / 100).toFixed(2);

  // Build base parameters
  const baseParams: Record<string, string> = {
    clientAccnum: config.clientAccountNumber,
    clientSubacc: config.subaccountNumber,
    currencyCode: config.currencyCode || '840',
    formName: 'subscription', // CCBill form type
    formPrice: amount,
    formPeriod: '30', // 30 days for monthly subscription
    formRecurringPrice: amount, // Recurring price (same as initial)
    formRecurringPeriod: '30', // Recurring period (30 days)
    formRebills: '99', // Number of rebills (99 = unlimited)
    // Custom fields for our tracking
    customUserId: userId,
    customCreatorId: creatorId,
    customTransactionType: transactionType,
    customReturnUrl: returnUrl,
    customFailureUrl: failureUrl,
  };

  // Add subscription-specific fields
  if (subscriptionId) {
    baseParams.customSubscriptionId = subscriptionId;
  }

  // Add PPV-specific fields
  if (postId) {
    baseParams.customPostId = postId;
    baseParams.formName = 'ppv'; // One-time payment
    delete baseParams.formRecurringPrice;
    delete baseParams.formRecurringPeriod;
    delete baseParams.formRebills;
  }

  // Add tip-specific fields
  if (transactionType === 'tip') {
    baseParams.formName = 'tip';
    delete baseParams.formRecurringPrice;
    delete baseParams.formRecurringPeriod;
    delete baseParams.formRebills;
  }

  // Add any additional custom data
  Object.entries(customData).forEach(([key, value]) => {
    baseParams[`custom${key}`] = value;
  });

  // Generate digest (CCBill security feature)
  const digestString = Object.entries(baseParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&') + config.salt;

  const digest = crypto.createHash('md5').update(digestString).digest('hex');
  baseParams.formDigest = digest;

  // Build query string
  const queryString = new URLSearchParams(baseParams).toString();

  // CCBill payment URL (use test URL if in development)
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://bill.ccbill.com/jpost/signup.cgi'
    : 'https://bill.ccbill.com/jpost/signup.cgi'; // CCBill test environment (same URL, different account)

  return `${baseUrl}?${queryString}`;
}

/**
 * Verify CCBill webhook signature
 * 
 * CCBill sends webhooks with a signature that must be verified
 * to ensure the request is authentic.
 * 
 * @param payload Webhook payload
 * @param signature Signature from CCBill
 * @returns true if signature is valid
 */
export function verifyCCBillWebhook(
  payload: CCBillWebhookPayload,
  signature: string
): boolean {
  const config = getCCBillConfig();
  if (!config) {
    return false;
  }

  // CCBill webhook verification logic
  // This is a simplified version - actual implementation depends on CCBill's spec
  const payloadString = JSON.stringify(payload);
  const expectedSignature = crypto
    .createHmac('sha256', config.webhookSecret)
    .update(payloadString)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Parse CCBill webhook event
 * 
 * CCBill sends various event types:
 * - subscription.created
 * - subscription.renewed
 * - subscription.canceled
 * - payment.completed
 * - payment.failed
 * - chargeback.created
 * 
 * @param payload Raw webhook payload
 * @returns Parsed event data
 */
export function parseCCBillWebhook(
  payload: CCBillWebhookPayload
): {
  eventType: string;
  subscriptionId?: string;
  transactionId: string;
  amountCents: number;
  currency: string;
  status: 'completed' | 'failed' | 'pending' | 'refunded';
  metadata: Record<string, unknown>;
} {
  const amountCents = Math.round(parseFloat(payload.amount || '0') * 100);

  return {
    eventType: payload.eventType,
    subscriptionId: payload.subscriptionId,
    transactionId: payload.transactionId,
    amountCents,
    currency: payload.currency || 'USD',
    status: payload.status === 'approved' ? 'completed' : 
            payload.status === 'declined' ? 'failed' :
            payload.status === 'refunded' ? 'refunded' : 'pending',
    metadata: payload,
  };
}

/**
 * Get CCBill transaction status URL
 * 
 * For admin/debugging purposes, generate a URL to view
 * transaction details in CCBill's admin panel.
 */
export function getCCBillTransactionUrl(transactionId: string): string {
  const config = getCCBillConfig();
  if (!config) {
    return '';
  }

  // CCBill admin URL format (may vary based on your account setup)
  return `https://admin.ccbill.com/transactions/${transactionId}`;
}


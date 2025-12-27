# CCBill Payment Integration Setup

## Overview

CCBill is the payment processor for NSFW/adult content platforms. This document explains how to set up and use CCBill with FanHouse.

## Why CCBill?

- **NSFW-friendly**: CCBill explicitly supports adult content platforms
- **Recurring subscriptions**: Built-in support for monthly subscriptions
- **Global reach**: Accepts payments from multiple countries
- **Chargeback handling**: Tools for managing disputes
- **Webhook support**: Real-time payment notifications

## Prerequisites

1. **CCBill Account**: Sign up at https://www.ccbill.com/
2. **Merchant Account**: Complete CCBill's merchant application
3. **Approval**: Wait for CCBill to approve your account (can take 1-2 weeks)

## Environment Variables

Add these to your `.env.local` file:

```bash
# CCBill Configuration
CCBILL_CLIENT_ACCOUNT_NUMBER=your_client_account_number
CCBILL_SUBACCOUNT_NUMBER=your_subaccount_number
CCBILL_SALT=your_salt_key
CCBILL_WEBHOOK_SECRET=your_webhook_secret

# Optional
CCBILL_FLEXFORMS_ID=your_flexforms_id
CCBILL_CURRENCY_CODE=840  # 840 = USD, see CCBill docs for other codes
USE_MOCK_PAYMENTS=false   # Set to true to use mock payments (dev only)
```

## Getting Your CCBill Credentials

### 1. Client Account Number

- Log into CCBill admin panel
- Navigate to **Account Settings**
- Your **Client Account Number** is displayed at the top

### 2. Subaccount Number

- In CCBill admin, go to **Subaccounts**
- Create a subaccount for FanHouse (or use default)
- Note the **Subaccount Number**

### 3. Salt Key

- In CCBill admin, go to **Account Settings** → **Security**
- Generate or view your **Salt Key** (used for payment link security)
- Keep this secret!

### 4. Webhook Secret

- In CCBill admin, go to **Webhooks** or **API Settings**
- Generate a webhook secret for signing webhook requests
- This is different from the salt key

### 5. FlexForms ID (Optional)

- CCBill's FlexForms allows custom payment forms
- If you want to customize the payment UI, create a FlexForm
- Note the **FlexForms ID**

## Webhook Configuration

### 1. Set Webhook URL

In CCBill admin panel:

1. Go to **Webhooks** or **API Settings**
2. Add webhook URL: `https://yourdomain.com/api/webhooks/ccbill`
3. Select events to receive:
   - `subscription.created`
   - `subscription.renewed`
   - `subscription.canceled`
   - `payment.completed`
   - `payment.failed`
   - `chargeback.created`

### 2. Test Webhooks

CCBill provides a webhook testing tool:

1. Use CCBill's test environment
2. Send test webhooks to your endpoint
3. Verify your webhook handler processes them correctly

## Payment Flow

### Subscription Flow

1. **User clicks "Subscribe"**

   - Frontend calls `POST /api/subscriptions`
   - API creates a pending subscription
   - API generates CCBill payment link
   - Returns `paymentUrl` to frontend

2. **User redirected to CCBill**

   - Frontend redirects user to `paymentUrl`
   - User enters payment details on CCBill's secure page
   - CCBill processes payment

3. **Payment Success**

   - CCBill redirects to `returnUrl`
   - CCBill sends webhook to `/api/webhooks/ccbill`
   - Webhook handler:
     - Verifies webhook signature
     - Updates subscription status to `active`
     - Creates transaction record
     - Creates ledger entry
     - Updates entitlements

4. **Payment Failure**
   - CCBill redirects to `failureUrl`
   - Subscription remains `pending`
   - User can retry payment

### PPV (Pay-Per-View) Flow

1. **User clicks "Unlock" on PPV post**

   - Frontend calls `POST /api/payments/ccbill/link` with `transactionType: 'ppv'`
   - API generates CCBill payment link
   - Returns `paymentUrl`

2. **Payment & Unlock**
   - Same flow as subscription
   - Webhook creates PPV entitlement
   - User can now view the post

### Tips Flow

1. **User sends tip**

   - Frontend calls `POST /api/payments/ccbill/link` with `transactionType: 'tip'`
   - API generates CCBill payment link
   - Returns `paymentUrl`

2. **Payment & Credit**
   - Same flow as subscription
   - Webhook creates ledger entry
   - Creator earnings updated

## Testing

### Development Mode

Set `USE_MOCK_PAYMENTS=true` in `.env.local` to bypass CCBill:

- Payments are automatically approved
- No real money is processed
- Useful for local development

### CCBill Test Mode

CCBill provides test credentials:

1. Use test account numbers
2. Use test credit cards (provided by CCBill)
3. Test webhooks in sandbox environment

### Test Credit Cards

CCBill provides test card numbers:

- **Success**: `4111111111111111`
- **Decline**: `4000000000000002`
- See CCBill docs for full list

## API Endpoints

### Generate Payment Link

```typescript
POST /api/payments/ccbill/link
{
  "creatorId": "uuid",
  "transactionType": "subscription" | "ppv" | "tip",
  "amountCents": 999,
  "subscriptionId": "uuid", // Optional, for renewals
  "postId": "uuid" // Optional, for PPV
}

Response:
{
  "paymentUrl": "https://bill.ccbill.com/...",
  "transactionType": "subscription",
  "amountCents": 999
}
```

### Webhook Handler

```typescript
POST / api / webhooks / ccbill;
// Called by CCBill automatically
// Processes payment events
```

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **HTTPS Only**: Webhooks must use HTTPS
3. **Idempotency**: Handle duplicate webhooks gracefully
4. **Salt Key**: Never expose salt key in client-side code
5. **Transaction IDs**: Store CCBill transaction IDs for reconciliation

## Common Issues

### Webhooks Not Received

1. Check webhook URL is publicly accessible
2. Verify webhook URL in CCBill admin
3. Check server logs for errors
4. Test with CCBill's webhook testing tool

### Payment Links Not Working

1. Verify salt key is correct
2. Check digest calculation
3. Ensure all required parameters are included
4. Test with CCBill's link generator

### Subscription Not Activating

1. Check webhook handler logs
2. Verify webhook signature verification
3. Ensure subscription ID matches
4. Check database for transaction records

## Support

- **CCBill Support**: https://support.ccbill.com/
- **CCBill Documentation**: https://docs.ccbill.com/
- **CCBill Admin Panel**: https://admin.ccbill.com/

## Next Steps

1. Complete CCBill merchant application
2. Get approved (1-2 weeks)
3. Configure environment variables
4. Set up webhook endpoint
5. Test with CCBill test environment
6. Go live with production credentials

## Migration from Mock Payments

When ready to switch from mock to real payments:

1. Set `USE_MOCK_PAYMENTS=false`
2. Add CCBill credentials to `.env.local`
3. Test in CCBill sandbox
4. Update webhook URL in CCBill admin
5. Test end-to-end flow
6. Switch to production credentials

# CCBill Integration Guide

Based on the FanHouse documentation, **CCBill** is the specified payment platform for billing and subscription integration.

## Why CCBill?

According to the documentation:
- CCBill is explicitly mentioned as the payment provider for:
  - Subscriptions (recurring)
  - One-time PPV purchases
  - Tips
- CCBill webhooks update ledger + entitlements → emit events
- CCBill supports adult/NSFW content platforms (critical for FanHouse)

## CCBill Integration Requirements

### 1. CCBill Account Setup

1. **Sign up for CCBill account**
   - Go to [ccbill.com](https://www.ccbill.com)
   - Apply for a merchant account
   - Complete KYC/verification process
   - Get approved for adult content (if applicable)

2. **Get Your Credentials**
   - Client Account Number
   - Subaccount Number
   - FlexForms API Key
   - Webhook Secret Key

### 2. Environment Variables

Add these to your `.env.local` and Vercel:

```env
CCBILL_CLIENT_ACCOUNT_NUMBER=your_client_account_number
CCBILL_SUBACCOUNT_NUMBER=your_subaccount_number
CCBILL_FLEXFORMS_API_KEY=your_flexforms_api_key
CCBILL_WEBHOOK_SECRET=your_webhook_secret
CCBILL_SALT_VALUE=your_salt_value
```

### 3. Integration Points

#### A. Subscription Payments

**Flow:**
1. User clicks "Subscribe" on creator page
2. Generate CCBill payment link using FlexForms
3. Redirect user to CCBill payment page
4. CCBill processes payment
5. CCBill sends webhook to your server
6. Update subscription status in database
7. Grant entitlement to user
8. Create ledger entry for creator earnings

**API Endpoint:** `POST /api/subscriptions/create`
- Generate CCBill payment link
- Store pending subscription in database
- Return payment URL to frontend

#### B. PPV (Pay-Per-View) Purchases

**Flow:**
1. User clicks "Unlock" on PPV post
2. Generate CCBill payment link for one-time purchase
3. Redirect to CCBill
4. CCBill processes payment
5. Webhook updates entitlement
6. User can now view content

**API Endpoint:** `POST /api/posts/[postId]/unlock`
- Currently uses mock payment
- Replace with CCBill integration

#### C. Tips

**Flow:**
1. User sends tip to creator
2. Generate CCBill payment link
3. Process payment
4. Webhook creates transaction
5. Add to creator ledger

**API Endpoint:** `POST /api/creators/[creatorId]/tip`
- Generate CCBill payment link
- Store pending tip transaction

### 4. Webhook Handler

**Endpoint:** `POST /api/webhooks/ccbill`

**Required Webhook Events:**
- `NewSaleSuccess` - Payment successful
- `NewSaleFailure` - Payment failed
- `RenewalSuccess` - Subscription renewed
- `RenewalFailure` - Renewal failed
- `Chargeback` - Chargeback received
- `Refund` - Refund processed

**Webhook Processing:**
1. Verify webhook signature
2. Parse webhook payload
3. Update transaction status
4. Update subscription status (if applicable)
5. Grant/revoke entitlements
6. Create ledger entries
7. Emit events for notifications

### 5. Implementation Steps

#### Step 1: Install CCBill SDK
```bash
npm install ccbill-js-sdk
# or use direct API calls
```

#### Step 2: Create Payment Link Generator

```typescript
// lib/ccbill.ts
export function generatePaymentLink(params: {
  amountCents: number;
  currency: string;
  subscriptionId?: string;
  postId?: string;
  userId: string;
  creatorId: string;
  type: 'subscription' | 'ppv' | 'tip';
}) {
  // Generate CCBill FlexForms URL
  // Include callback URLs
  // Include metadata for webhook processing
}
```

#### Step 3: Create Webhook Handler

```typescript
// app/api/webhooks/ccbill/route.ts
export async function POST(request: NextRequest) {
  // Verify signature
  // Parse payload
  // Update database
  // Grant entitlements
  // Create ledger entries
}
```

#### Step 4: Update Existing Endpoints

- Replace mock payment in `/api/posts/[postId]/unlock`
- Replace mock payment in `/api/subscriptions/create`
- Add tip endpoint

### 6. Testing

CCBill provides:
- **Sandbox/Test Mode** - For development
- **Test Cards** - For testing different scenarios
- **Webhook Testing Tool** - For testing webhook handling

### 7. Production Checklist

- [ ] CCBill account approved
- [ ] Webhook endpoint secured (HTTPS, signature verification)
- [ ] Error handling for failed payments
- [ ] Chargeback handling
- [ ] Refund processing
- [ ] Subscription renewal logic
- [ ] Ledger entries for all transactions
- [ ] Entitlement granting/revocation
- [ ] Email notifications for payment events

### 8. Security Considerations

- **Webhook Signature Verification**: Always verify CCBill webhook signatures
- **HTTPS Only**: Webhook endpoint must use HTTPS
- **Idempotency**: Handle duplicate webhooks gracefully
- **Rate Limiting**: Protect webhook endpoint from abuse
- **Logging**: Log all payment events for audit trail

### 9. Documentation References

- [CCBill Developer Documentation](https://www.ccbill.com/developers/)
- [CCBill FlexForms API](https://www.ccbill.com/developers/flexforms/)
- [CCBill Webhook Guide](https://www.ccbill.com/developers/webhooks/)

### 10. Current Status

**Current Implementation:**
- ✅ Mock payment system in place
- ✅ Transaction table structure ready
- ✅ Ledger system implemented
- ✅ Entitlement system ready
- ❌ CCBill integration not yet implemented

**Next Steps:**
1. Set up CCBill account
2. Implement payment link generation
3. Implement webhook handler
4. Replace mock payments with CCBill
5. Test end-to-end payment flow

---

## Alternative Considerations

While CCBill is specified in the documentation, you may also consider:
- **Stripe** (if adult content policy allows)
- **Crypto payments** (as mentioned in docs)
- **Other adult-friendly processors**

However, **CCBill is the recommended platform** per the documentation for its adult content support and reliability.

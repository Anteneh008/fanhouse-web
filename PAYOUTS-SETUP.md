# Payout System Setup

## Overview

The payout system allows creators to request payouts of their earnings, and admins to process those payouts.

## Database Setup

Run the payout schema SQL file to create the `payouts` table:

```bash
psql $DATABASE_URL -f lib/db-schema-payouts.sql
```

Or manually execute the SQL in `lib/db-schema-payouts.sql`.

## Features

### Creator Side

1. **View Earnings** (`/creator/earnings`)
   - See total earnings, pending balance, and paid out amounts
   - View transaction history
   - Link to request payouts

2. **Request Payout** (`/creator/payouts`)
   - Request payout of pending earnings
   - Minimum payout: $10.00
   - Choose payout method (bank transfer, Paxum, Skrill, crypto, etc.)
   - View payout history

### Admin Side

1. **Payout Management** (`/admin/payouts`)
   - View all payout requests
   - See stats (pending, processing, completed, failed)
   - Process payouts (approve, reject, cancel)
   - Add admin notes

## Payout Flow

1. **Creator Requests Payout**
   - Creator goes to `/creator/payouts`
   - Enters amount (minimum $10)
   - Selects payout method
   - Submits request

2. **Payout Created**
   - Status: `pending`
   - Appears in admin panel

3. **Admin Processes Payout**
   - Admin reviews payout request
   - Approves → Creates ledger entry (negative amount)
   - Rejects → Marks as failed with reason
   - Cancels → Marks as cancelled

4. **Payout Completed**
   - Status: `completed`
   - Ledger entry created (reduces pending balance)
   - Creator can see it in payout history

## API Endpoints

### Creator Endpoints

- `GET /api/creators/earnings` - Get earnings summary
- `GET /api/creators/payouts/request` - Get payout history
- `POST /api/creators/payouts/request` - Request new payout

### Admin Endpoints

- `GET /api/admin/payouts` - Get all payouts (with stats)
- `POST /api/admin/payouts/[payoutId]/process` - Process payout

## Payout Methods

Supported payout methods:
- `bank_transfer` - Bank wire transfer
- `paxum` - Paxum wallet
- `skrill` - Skrill wallet
- `crypto` - Cryptocurrency
- `other` - Other methods

## Ledger Integration

When a payout is approved:
1. A ledger entry is created with `entry_type = 'payout'`
2. The `net_amount_cents` is negative (reduces balance)
3. The `pending_earnings_cents` calculation automatically accounts for this

## Security

- Only creators can request payouts
- Only approved creators can request payouts
- Only admins can process payouts
- Minimum payout amount enforced ($10)
- Balance validation (can't request more than available)

## Next Steps

1. Run the database migration (`lib/db-schema-payouts.sql`)
2. Test payout request flow
3. Test admin payout processing
4. Integrate with actual payment providers (bank transfers, Paxum, etc.)


-- Payouts table - Track payout requests and processing
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  payout_method VARCHAR(50) NOT NULL CHECK (payout_method IN ('bank_transfer', 'paxum', 'skrill', 'crypto', 'other')),
  payout_details JSONB, -- Store payment method details (account number, etc.)
  admin_notes TEXT, -- Admin notes for processing
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who processed it
  processed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT, -- If failed, why
  ledger_entry_id UUID REFERENCES ledger_entries(id) ON DELETE SET NULL, -- Link to ledger entry
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payouts_creator_id ON payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON payouts(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_payouts_updated_at 
  BEFORE UPDATE ON payouts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


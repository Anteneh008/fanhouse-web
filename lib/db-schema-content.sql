-- Content System Schema for FanHouse
-- Run this after db-schema.sql and db-schema-extended.sql

-- Posts table - Core content metadata
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT, -- Post text content
  visibility_type VARCHAR(50) NOT NULL CHECK (visibility_type IN ('free', 'subscriber', 'ppv')),
  price_cents INTEGER DEFAULT 0, -- Price in cents for PPV posts
  is_pinned BOOLEAN DEFAULT false,
  is_disabled BOOLEAN DEFAULT false, -- Admin can disable posts
  disabled_reason TEXT, -- Why it was disabled
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media assets table - Images and videos
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL, -- URL to the media file
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('image', 'video')),
  file_size BIGINT, -- Size in bytes
  mime_type VARCHAR(100), -- e.g., 'image/jpeg', 'video/mp4'
  thumbnail_url TEXT, -- Thumbnail for videos/images
  width INTEGER, -- Image/video width
  height INTEGER, -- Image/video height
  duration INTEGER, -- Video duration in seconds
  processing_status VARCHAR(50) DEFAULT 'completed' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT, -- Error message if processing failed
  sort_order INTEGER DEFAULT 0, -- Order within post
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table - Fan subscriptions to creators
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_name VARCHAR(100) DEFAULT 'Basic',
  price_cents INTEGER NOT NULL, -- Monthly subscription price
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'canceled', 'expired', 'pending')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE, -- When subscription expires
  canceled_at TIMESTAMP WITH TIME ZONE, -- When user canceled
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(fan_id, creator_id) -- One subscription per fan-creator pair
);

-- Entitlements table - Access control (who can view what)
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE, -- For subscription entitlements
  entitlement_type VARCHAR(50) NOT NULL CHECK (entitlement_type IN ('subscription', 'ppv_purchase', 'tip', 'free')),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL, -- Link to subscription if applicable
  transaction_id UUID, -- Link to transaction that granted this entitlement
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent entitlements (PPV purchases)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id, entitlement_type) -- Prevent duplicate entitlements
);

-- Transactions table - Payment records
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Fan who paid
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Creator who received
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL, -- Post if PPV
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL, -- Subscription if applicable
  amount_cents INTEGER NOT NULL, -- Total amount charged
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('subscription', 'ppv', 'tip')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_provider VARCHAR(50) DEFAULT 'mock', -- 'ccbill', 'mock', etc.
  payment_provider_transaction_id VARCHAR(255), -- External transaction ID
  failure_reason TEXT, -- Why payment failed
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ledger entries table - Append-only earnings ledger
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL, -- Gross amount
  platform_fee_cents INTEGER NOT NULL DEFAULT 0, -- Platform fee (e.g., 20%)
  net_amount_cents INTEGER NOT NULL, -- Amount to creator (amount - fee)
  description TEXT, -- Human-readable description
  entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('earnings', 'payout', 'refund', 'adjustment')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_visibility_type ON posts(visibility_type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_disabled ON posts(is_disabled) WHERE is_disabled = false;

CREATE INDEX IF NOT EXISTS idx_media_assets_post_id ON media_assets(post_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_processing_status ON media_assets(processing_status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_fan_id ON subscriptions(fan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);

CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_post_id ON entitlements(post_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_creator_id ON entitlements(creator_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_type ON entitlements(entitlement_type);
CREATE INDEX IF NOT EXISTS idx_entitlements_expires_at ON entitlements(expires_at);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_creator_id ON transactions(creator_id);
CREATE INDEX IF NOT EXISTS idx_transactions_post_id ON transactions(post_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_creator_id ON ledger_entries(creator_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at ON ledger_entries(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate creator earnings (from ledger)
CREATE OR REPLACE FUNCTION get_creator_earnings(p_creator_id UUID)
RETURNS TABLE(
  total_earnings_cents BIGINT,
  total_payouts_cents BIGINT,
  pending_earnings_cents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN entry_type = 'earnings' THEN net_amount_cents ELSE 0 END), 0)::BIGINT as total_earnings_cents,
    COALESCE(SUM(CASE WHEN entry_type = 'payout' THEN ABS(net_amount_cents) ELSE 0 END), 0)::BIGINT as total_payouts_cents,
    COALESCE(SUM(CASE WHEN entry_type = 'earnings' THEN net_amount_cents ELSE 0 END), 0)::BIGINT - 
    COALESCE(SUM(CASE WHEN entry_type = 'payout' THEN ABS(net_amount_cents) ELSE 0 END), 0)::BIGINT as pending_earnings_cents
  FROM ledger_entries
  WHERE creator_id = p_creator_id;
END;
$$ LANGUAGE plpgsql;


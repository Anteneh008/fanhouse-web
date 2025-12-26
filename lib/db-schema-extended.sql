-- Extended schema for FanHouse creator onboarding and profiles
-- Run this after the base schema (db-schema.sql)

-- Creator profiles table
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  bio TEXT,
  profile_image_url TEXT,
  cover_image_url TEXT,
  subscription_tier_name VARCHAR(100) DEFAULT 'Basic',
  subscription_price_cents INTEGER DEFAULT 0, -- Price in cents (e.g., 999 = $9.99)
  is_free_profile BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- KYC verifications table (Persona integration)
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_inquiry_id VARCHAR(255), -- Persona's inquiry ID
  persona_verification_id VARCHAR(255), -- Persona's verification ID
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'failed')),
  verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('kyc', 'age_verification')),
  risk_level VARCHAR(50), -- Persona risk signals
  persona_webhook_data JSONB, -- Store Persona webhook payload
  rejection_reason TEXT, -- If rejected, why
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, verification_type)
);

-- Ensure rejection_reason column exists (for existing tables)
ALTER TABLE kyc_verifications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Ensure unique constraint exists
CREATE UNIQUE INDEX IF NOT EXISTS kyc_verifications_user_type_unique ON kyc_verifications(user_id, verification_type);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications(status);
CREATE INDEX IF NOT EXISTS idx_users_creator_status ON users(creator_status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_creator_profiles_updated_at 
  BEFORE UPDATE ON creator_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kyc_verifications_updated_at 
  BEFORE UPDATE ON kyc_verifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


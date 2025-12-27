-- Messaging System Schema for FanHouse
-- Run this after db-schema.sql, db-schema-extended.sql, and db-schema-content.sql

-- Message threads table - Conversations between fans and creators
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_message_preview TEXT, -- Preview of last message
  fan_unread_count INTEGER DEFAULT 0, -- Unread messages for fan
  creator_unread_count INTEGER DEFAULT 0, -- Unread messages for creator
  is_archived_by_fan BOOLEAN DEFAULT false,
  is_archived_by_creator BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(fan_id, creator_id) -- One thread per fan-creator pair
);

-- Messages table - Individual messages in threads
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Who sent the message
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Who receives it
  content TEXT NOT NULL, -- Message text content
  message_type VARCHAR(50) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video')),
  media_url TEXT, -- URL to media if message_type is image/video
  price_cents INTEGER DEFAULT 0, -- Price for paid messages (0 = free)
  is_paid BOOLEAN DEFAULT false, -- Whether this is a paid message
  payment_status VARCHAR(50) DEFAULT 'free' CHECK (payment_status IN ('free', 'pending', 'paid', 'declined')),
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL, -- Link to payment transaction
  is_read BOOLEAN DEFAULT false, -- Read receipt
  read_at TIMESTAMP WITH TIME ZONE, -- When message was read
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_threads_fan_id ON message_threads(fan_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_creator_id ON message_threads(creator_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message_at ON message_threads(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_payment_status ON messages(payment_status);

-- Trigger to update thread's last_message_at and preview
CREATE OR REPLACE FUNCTION update_thread_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = CURRENT_TIMESTAMP,
    fan_unread_count = CASE 
      WHEN NEW.recipient_id = (SELECT fan_id FROM message_threads WHERE id = NEW.thread_id)
      THEN fan_unread_count + 1
      ELSE fan_unread_count
    END,
    creator_unread_count = CASE 
      WHEN NEW.recipient_id = (SELECT creator_id FROM message_threads WHERE id = NEW.thread_id)
      THEN creator_unread_count + 1
      ELSE creator_unread_count
    END
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_on_message();

-- Trigger to update thread's updated_at
CREATE TRIGGER update_message_threads_updated_at 
  BEFORE UPDATE ON message_threads 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_thread_messages_read(
  p_thread_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  -- Mark messages as read
  UPDATE messages
  SET is_read = true, read_at = CURRENT_TIMESTAMP
  WHERE thread_id = p_thread_id 
    AND recipient_id = p_user_id 
    AND is_read = false;

  -- Update unread counts
  UPDATE message_threads
  SET 
    fan_unread_count = CASE 
      WHEN p_user_id = fan_id THEN 0
      ELSE fan_unread_count
    END,
    creator_unread_count = CASE 
      WHEN p_user_id = creator_id THEN 0
      ELSE creator_unread_count
    END
  WHERE id = p_thread_id;
END;
$$ LANGUAGE plpgsql;


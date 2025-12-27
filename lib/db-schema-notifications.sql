-- Notifications System Schema for FanHouse
-- Run this after db-schema.sql, db-schema-extended.sql, and db-schema-content.sql

-- Notification preferences table - User notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  -- Notification type preferences
  new_message_enabled BOOLEAN DEFAULT true,
  new_message_email_enabled BOOLEAN DEFAULT true,
  new_post_enabled BOOLEAN DEFAULT true,
  new_post_email_enabled BOOLEAN DEFAULT true,
  subscription_renewed_enabled BOOLEAN DEFAULT true,
  subscription_renewed_email_enabled BOOLEAN DEFAULT true,
  payment_received_enabled BOOLEAN DEFAULT true,
  payment_received_email_enabled BOOLEAN DEFAULT true,
  new_follower_enabled BOOLEAN DEFAULT true,
  new_follower_email_enabled BOOLEAN DEFAULT true,
  new_comment_enabled BOOLEAN DEFAULT true,
  new_comment_email_enabled BOOLEAN DEFAULT true,
  new_like_enabled BOOLEAN DEFAULT true,
  new_like_email_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- In-app notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'new_message',
    'new_post',
    'subscription_renewed',
    'payment_received',
    'new_follower',
    'new_comment',
    'new_like',
    'creator_approved',
    'creator_rejected',
    'payout_processed',
    'admin_action'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  -- Related entity references (optional)
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  related_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  related_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  -- Knock metadata
  knock_notification_id VARCHAR(255), -- Knock's notification ID
  knock_workflow_id VARCHAR(255), -- Knock workflow that triggered this
  -- Metadata for rendering
  metadata JSONB, -- Additional data for notification rendering
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_knock_id ON notifications(knock_notification_id);

-- Trigger to update notification_preferences updated_at
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id AND is_read = false
  );
END;
$$ LANGUAGE plpgsql;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(p_user_id UUID, p_notification_ids UUID[] DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL OR array_length(p_notification_ids, 1) IS NULL THEN
    -- Mark all as read
    UPDATE notifications
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id AND is_read = false;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id 
      AND id = ANY(p_notification_ids)
      AND is_read = false;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  END IF;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;


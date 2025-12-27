-- Live Streaming Schema for FanHouse
-- Run this after db-schema-content.sql

-- Live streams table
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  stream_key VARCHAR(255) UNIQUE NOT NULL, -- Unique key for RTMP/HLS ingestion
  playback_url TEXT, -- HLS playback URL for viewers
  rtmp_url TEXT, -- RTMP ingest URL for streaming software
  mux_stream_id VARCHAR(255), -- Mux live stream ID (if using Mux)
  thumbnail_url TEXT, -- Stream thumbnail/preview
  status VARCHAR(50) NOT NULL CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')) DEFAULT 'scheduled',
  visibility_type VARCHAR(50) NOT NULL CHECK (visibility_type IN ('free', 'subscriber', 'ppv')) DEFAULT 'free',
  price_cents INTEGER DEFAULT 0, -- Price for PPV streams
  viewer_count INTEGER DEFAULT 0, -- Current viewer count
  peak_viewer_count INTEGER DEFAULT 0, -- Peak viewers during stream
  started_at TIMESTAMP WITH TIME ZONE, -- When stream actually started
  ended_at TIMESTAMP WITH TIME ZONE, -- When stream ended
  scheduled_start_at TIMESTAMP WITH TIME ZONE, -- When stream is scheduled to start
  replay_url TEXT, -- URL to replay video (after stream ends)
  replay_post_id UUID REFERENCES posts(id) ON DELETE SET NULL, -- Post created from replay
  is_disabled BOOLEAN DEFAULT false, -- Admin can disable streams
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stream viewers table - Track who is watching
CREATE TABLE IF NOT EXISTS stream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP WITH TIME ZONE,
  watch_duration_seconds INTEGER DEFAULT 0, -- Total time watched
  UNIQUE(stream_id, user_id) -- One entry per user per stream
);

-- Stream chat messages table
CREATE TABLE IF NOT EXISTS stream_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_moderator BOOLEAN DEFAULT false, -- Creator or admin
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stream entitlements - Who can watch (for subscriber/PPV streams)
CREATE TABLE IF NOT EXISTS stream_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entitlement_type VARCHAR(50) NOT NULL CHECK (entitlement_type IN ('subscription', 'ppv_purchase', 'free')),
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stream_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_creator_id ON live_streams(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_status_created ON live_streams(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_streams_stream_key ON live_streams(stream_key);

CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_user_id ON stream_viewers(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_active ON stream_viewers(stream_id, left_at) WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stream_chat_messages_stream_id ON stream_chat_messages(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_chat_messages_created_at ON stream_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_chat_messages_stream_created ON stream_chat_messages(stream_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stream_entitlements_stream_id ON stream_entitlements(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_entitlements_user_id ON stream_entitlements(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_live_streams_updated_at 
  BEFORE UPDATE ON live_streams 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get active streams
CREATE OR REPLACE FUNCTION get_active_streams()
RETURNS TABLE(
  id UUID,
  creator_id UUID,
  title VARCHAR,
  description TEXT,
  status VARCHAR,
  viewer_count INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ls.id,
    ls.creator_id,
    ls.title,
    ls.description,
    ls.status,
    ls.viewer_count,
    ls.started_at,
    ls.created_at
  FROM live_streams ls
  WHERE ls.status = 'live' 
    AND ls.is_disabled = false
  ORDER BY ls.started_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to update viewer count
CREATE OR REPLACE FUNCTION update_stream_viewer_count(p_stream_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM stream_viewers
  WHERE stream_id = p_stream_id AND left_at IS NULL;
  
  UPDATE live_streams
  SET viewer_count = v_count,
      peak_viewer_count = GREATEST(peak_viewer_count, v_count)
  WHERE id = p_stream_id;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;


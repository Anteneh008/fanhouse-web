# Live Streaming Implementation

## Overview

Live streaming functionality has been implemented for FanHouse, allowing creators to go live and fans to watch streams in real-time with integrated live chat.

## Features Implemented

### ✅ Core Features

1. **Database Schema**

   - `live_streams` table - Stream metadata and status
   - `stream_viewers` table - Track who is watching
   - `stream_chat_messages` table - Chat message history
   - `stream_entitlements` table - Access control for subscriber/PPV streams
   - Helper functions for viewer count and active streams

2. **API Endpoints**

   **Creator Endpoints:**

   - `POST /api/creators/streams` - Create a new stream
   - `GET /api/creators/streams` - List creator's streams
   - `GET /api/creators/streams/[streamId]` - Get stream details
   - `POST /api/creators/streams/[streamId]` - Start a stream
   - `PUT /api/creators/streams/[streamId]` - Stop a stream

   **Fan Endpoints:**

   - `GET /api/streams` - List all active live streams
   - `GET /api/streams/[streamId]` - Get stream details (with access check)
   - `POST /api/streams/[streamId]/viewers` - Join stream as viewer
   - `DELETE /api/streams/[streamId]/viewers` - Leave stream
   - `POST /api/streams/[streamId]/unlock` - Unlock PPV stream
   - `POST /api/streams/[streamId]/chat` - Send chat message
   - `GET /api/streams/[streamId]/chat` - Get chat messages

3. **Frontend Pages**

   **Creator Pages:**

   - `/creator/streams` - Stream management page (create, list, start/stop)
   - Stream creation modal with visibility and pricing options

   **Fan Pages:**

   - `/streams` - Browse all active live streams
   - `/streams/[streamId]` - Watch stream with live chat

4. **Real-Time Features**

   - Live chat using Ably (real-time message delivery)
   - Viewer count tracking
   - Stream status updates

5. **Access Control**
   - Free streams (everyone can watch)
   - Subscriber-only streams (requires active subscription)
   - Pay-per-view streams (requires purchase)

## Database Setup

Run the database initialization script to create the live streaming tables:

```bash
node scripts/init-all-schemas.js
```

Or initialize just the livestreams schema:

```bash
psql $DATABASE_URL -f lib/db-schema-livestreams.sql
```

## Usage

### For Creators

1. **Create a Stream**

   - Navigate to `/creator/streams`
   - Click "Go Live" button
   - Fill in stream details:
     - Title (required)
     - Description (optional)
     - Visibility (free, subscriber-only, or PPV)
     - Price (if PPV)
   - Click "Create Stream"

2. **Start Streaming**

   - Find your stream in the list
   - Click "Start" button
   - Use the `streamKey` with your streaming software (OBS, etc.)
   - Stream will be visible to viewers

3. **Stop Streaming**
   - Click "Stop" button while streaming
   - Stream status will change to "ended"

### For Fans

1. **Browse Streams**

   - Navigate to `/streams`
   - See all active live streams
   - Click on a stream to watch

2. **Watch Stream**

   - Stream video player (HLS playback)
   - Live chat on the right side
   - Real-time viewer count
   - Send messages in chat

3. **Unlock PPV Streams**
   - Click "Unlock" button for PPV streams
   - Complete payment (mock payment for now)
   - Stream becomes accessible

## Streaming Infrastructure

### ✅ Mux Integration (Implemented)

Mux integration is now fully implemented! See `MUX-SETUP.md` for setup instructions.

**Features:**

- ✅ Automatic live stream creation
- ✅ RTMP ingest URLs
- ✅ HLS playback URLs
- ✅ Automatic recording and replay
- ✅ Stream status checking
- ✅ Global CDN delivery

**Setup Required:**

1. Create Mux account
2. Get API credentials (Token ID & Secret)
3. Add to environment variables:
   ```env
   MUX_TOKEN_ID=your_token_id
   MUX_TOKEN_SECRET=your_token_secret
   ```

**Alternative Services (Not Implemented):**

- **Cloudflare Stream** - Global CDN, HLS/DASH
- **AWS IVS** - Low-latency streaming
- **Self-hosted** - Use nginx-rtmp or similar

### Integration Steps

1. **Set up streaming service account**
2. **Configure environment variables:**

   ```env
   STREAMING_SERVICE_URL=https://your-streaming-service.com
   STREAMING_API_KEY=your-api-key
   ```

3. **Update stream creation endpoint** (`app/api/creators/streams/route.ts`):

   - Generate RTMP ingest URL
   - Generate HLS playback URL
   - Store both in database

4. **Update stream start endpoint**:
   - Notify streaming service when stream starts
   - Get actual playback URL

### Mux Integration (Implemented)

Mux integration is fully implemented in `lib/mux.ts` and automatically used when `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are set.

**How it works:**

1. When a creator creates a stream, a Mux live stream is automatically created
2. RTMP URL and stream key are generated
3. HLS playback URL is provided for viewers
4. When stream ends, replay asset is automatically created

See `MUX-SETUP.md` for detailed setup instructions.

## Stream Key Format

Stream keys are generated in the format:

```
stream_{creatorId}_{timestamp}_{randomUUID}
```

Example: `stream_abc123_1704067200000_a1b2c3d4`

## Chat System

- Uses Ably for real-time chat delivery
- Channel name: `stream:{streamId}:chat`
- Messages are persisted to database
- Moderator badges for creators/admins
- Message limit: 500 characters

## Viewer Tracking

- Automatically tracks when users join/leave
- Updates viewer count in real-time
- Calculates watch duration
- Tracks peak viewer count

## Future Enhancements

### Phase 2 (Hardening)

- [ ] Stream quality selection (adaptive bitrate)
- [ ] Stream recording/replay
- [ ] Stream analytics (viewer retention, peak times)
- [ ] Stream scheduling notifications
- [ ] Stream moderation tools (ban users, delete messages)

### Phase 3 (Advanced Features)

- [ ] Multi-camera streams
- [ ] Stream overlays (donations, goals)
- [ ] Stream co-hosting
- [ ] Stream clips/highlights
- [ ] Stream transcoding (multiple quality levels)
- [ ] Stream DVR (rewind live streams)

## Security Considerations

1. **Access Control**

   - Streams respect visibility settings
   - PPV streams require payment verification
   - Subscriber streams check active subscriptions

2. **Stream Keys**

   - Unique per stream
   - Should be kept secret (only creator can see)
   - Consider rotating keys for security

3. **Chat Moderation**
   - Creators and admins are marked as moderators
   - Consider adding message filtering
   - Implement rate limiting for chat messages

## Testing

1. **Create a test stream:**

   ```bash
   curl -X POST http://localhost:3000/api/creators/streams \
     -H "Cookie: auth_token=..." \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Stream","visibilityType":"free"}'
   ```

2. **Start the stream:**

   ```bash
   curl -X POST http://localhost:3000/api/creators/streams/{streamId} \
     -H "Cookie: auth_token=..."
   ```

3. **Join as viewer:**
   ```bash
   curl -X POST http://localhost:3000/api/streams/{streamId}/viewers \
     -H "Cookie: auth_token=..."
   ```

## Navigation Updates

- Added "Streams" link to creator dashboard navigation
- Streams page accessible at `/streams` for all users
- Creator streams management at `/creator/streams`

## Notes

- ✅ **Mux Integration:** Fully implemented - see `MUX-SETUP.md` for setup
- Currently uses mock payments for PPV streams
- Viewer count updates every 10 seconds (can be made real-time with Ably)
- Chat messages are limited to 500 characters
- Streams can be scheduled but scheduling UI is not yet implemented
- Replay URLs are automatically generated when streams end (if using Mux)

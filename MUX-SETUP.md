# Mux Integration Setup Guide

## Overview

Mux provides live streaming infrastructure with HLS playback, automatic recording, and global CDN delivery. This guide will help you set up Mux for FanHouse live streaming.

## Getting Started

### 1. Create a Mux Account

1. Go to [https://mux.com](https://mux.com)
2. Sign up for a free account
3. Navigate to Settings → API Access Tokens
4. Create a new access token with the following permissions:
   - **Video API** - Read & Write
   - **Data API** - Read (optional, for analytics)

### 2. Get Your API Credentials

After creating an access token, you'll get:

- **Token ID** (starts with `...`)
- **Token Secret** (starts with `...`)

**Important:** Keep your token secret secure! Never commit it to version control.

### 3. Configure Environment Variables

Add these to your `.env.local` file:

```env
MUX_TOKEN_ID=your_token_id_here
MUX_TOKEN_SECRET=your_token_secret_here
```

For production (Vercel), add these in your Vercel project settings:

1. Go to Project Settings → Environment Variables
2. Add `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET`
3. Redeploy your application

## How It Works

### Stream Creation Flow

1. **Creator creates a stream** via `/creator/streams`
2. **Mux live stream is created** automatically
3. **RTMP URL and stream key** are generated
4. **HLS playback URL** is provided for viewers

### Streaming Setup

1. **Creator gets RTMP URL and stream key** from the stream details
2. **Configure streaming software** (OBS, Streamlabs, etc.):
   - **Server:** `rtmp://global-live.mux.com:5222/app`
   - **Stream Key:** The stream key from the stream details
3. **Start streaming** from your software
4. **Start the stream** in FanHouse (click "Start" button)
5. **Viewers can watch** via the HLS playback URL

### Stream Lifecycle

1. **Scheduled** - Stream is created, waiting to start
2. **Live** - Stream is active and broadcasting
3. **Ended** - Stream has stopped, replay available (if recorded)

## Features

### ✅ Automatic Recording

Mux automatically records live streams and creates replay assets. When a stream ends:

- A replay asset is created automatically
- The replay URL is stored in the database
- Viewers can watch the replay

### ✅ Global CDN

- Streams are delivered via Mux's global CDN
- Low latency with reduced latency mode enabled
- Adaptive bitrate streaming (HLS)

### ✅ Stream Status

- Real-time stream status checking
- Connection validation before going live
- Automatic asset creation for replays

## Testing

### 1. Create a Test Stream

```bash
curl -X POST http://localhost:3000/api/creators/streams \
  -H "Cookie: auth_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Stream",
    "description": "Testing Mux integration",
    "visibilityType": "free"
  }'
```

### 2. Get Stream Details

The response will include:

- `streamKey` - For RTMP streaming
- `rtmpUrl` - Full RTMP URL
- `playbackUrl` - HLS playback URL for viewers

### 3. Configure OBS

1. Open OBS Studio
2. Go to Settings → Stream
3. Set Service to "Custom"
4. Set Server to: `rtmp://global-live.mux.com:5222/app`
5. Set Stream Key to: Your stream key from the API response
6. Click OK

### 4. Start Streaming

1. Click "Start Streaming" in OBS
2. Go to FanHouse and click "Start" on your stream
3. Viewers can now watch at the playback URL

## Troubleshooting

### Stream Not Connecting

- **Check stream key** - Make sure you're using the correct stream key
- **Check RTMP URL** - Verify the server URL is correct
- **Check network** - Ensure your firewall allows RTMP (port 5222)
- **Check Mux status** - Verify your Mux account is active

### Playback Not Working

- **Check playback URL** - Verify the URL is correct
- **Check stream status** - Stream must be "live" to play
- **Check browser** - Some browsers require HTTPS for HLS
- **Check Mux dashboard** - Verify the stream is active in Mux

### Replay Not Available

- **Wait a few minutes** - Mux needs time to process the recording
- **Check stream ended** - Replay is only available after stream ends
- **Check Mux dashboard** - Verify the asset was created

## Mux Dashboard

You can monitor your streams in the Mux dashboard:

- View active streams
- Check stream health
- View analytics
- Access replay assets

## Pricing

Mux offers a free tier with:

- 100 minutes of live streaming per month
- 100 minutes of video storage per month
- 100 minutes of video delivered per month

For production use, consider upgrading to a paid plan:

- Pay-as-you-go pricing
- No long-term commitments
- Scale as you grow

See [Mux Pricing](https://mux.com/pricing) for details.

## Security Best Practices

1. **Never commit secrets** - Keep token secret in environment variables only
2. **Use different tokens** - Use separate tokens for dev/staging/prod
3. **Rotate tokens** - Regularly rotate your API tokens
4. **Monitor usage** - Check Mux dashboard for unusual activity
5. **Set up webhooks** - Configure Mux webhooks for stream events (optional)

## Advanced Configuration

### Custom Stream Settings

You can customize stream settings in `lib/mux.ts`:

```typescript
const liveStream = await mux.video.liveStreams.create({
  playback_policy: ["public"],
  new_asset_settings: {
    playback_policy: ["public"],
    normalize_audio: true, // Normalize audio levels
  },
  reconnect_window: 60, // Reconnect window in seconds
  reduced_latency: true, // Enable reduced latency
  // Add more settings as needed
});
```

### Webhook Integration

Set up Mux webhooks to get notified of stream events:

- Stream started
- Stream ended
- Asset created
- Stream disconnected

Configure webhook URL in Mux dashboard:
`https://your-domain.com/api/webhooks/mux`

## Support

- **Mux Documentation:** https://docs.mux.com
- **Mux Support:** support@mux.com
- **Mux Community:** https://mux.com/community

## Next Steps

1. ✅ Set up Mux account and get API credentials
2. ✅ Add environment variables
3. ✅ Test stream creation
4. ✅ Configure OBS or other streaming software
5. ✅ Test live streaming
6. ✅ Test replay functionality

Happy streaming! 🎥

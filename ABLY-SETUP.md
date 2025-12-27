# Ably Integration Setup Guide

## Overview

FanHouse uses **Ably** for real-time messaging features including:

- Real-time message delivery
- Typing indicators
- Online/offline presence
- Message delivery receipts

## Getting Started with Ably Free Trial

1. **Sign up for Ably**

   - Go to https://ably.com/sign-up
   - Create a free account (no credit card required for free tier)
   - Free tier includes:
     - 2M messages/month
     - 200 concurrent connections
     - 200 channels
     - Perfect for development and MVP

2. **Get your API Key**

   - After signing up, go to your Ably dashboard
   - Navigate to "API Keys" section
   - Copy your **API Key** (starts with `xVLyHw.` or similar)

3. **Add to Environment Variables**

   Create or update your `.env.local` file:

   ```env
   ABLY_API_KEY=your-ably-api-key-here
   ```

   Example:

   ```env
   ABLY_API_KEY=xVLyHw.ABC123:XYZ789
   ```

## Installation

The Ably SDK is already installed. If you need to reinstall:

```bash
npm install ably
```

## How It Works

### Server-Side (API)

- **`lib/ably.ts`** - Server-side Ably client for publishing messages
- **`app/api/ably/token/route.ts`** - Token authentication endpoint for clients
- **`app/api/messages/send/route.ts`** - Publishes messages to Ably channels

### Client-Side (React)

- **`lib/hooks/useAbly.ts`** - React hook for Ably integration
- **`app/messages/[threadId]/page.tsx`** - Fan message thread with Ably
- **`app/creator/messages/[threadId]/page.tsx`** - Creator message thread with Ably

## Features Implemented

✅ **Real-time Message Delivery**

- Messages appear instantly without polling
- No 3-second delay

✅ **Typing Indicators**

- Shows when the other person is typing
- Automatically clears after 3 seconds

✅ **Online Status**

- Shows "● Online" when connected
- Uses Ably presence

✅ **Message Publishing**

- When a message is sent via API, it's published to Ably
- All connected clients receive it instantly

## Channel Structure

- **Message Channel**: `thread:{threadId}`

  - Event: `message` - New message received
  - Event: `typing` - Typing indicator

- **Presence Channel**: `presence:{threadId}`
  - Tracks who's online in the thread

## Testing

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Open two browser windows:**

   - Window 1: Login as a fan
   - Window 2: Login as a creator

3. **Start a conversation:**
   - Fan sends a message
   - Creator should see it instantly (no refresh needed)
   - Typing indicators should appear when typing

## Troubleshooting

### "ABLY_API_KEY environment variable is not set"

- Make sure `.env.local` exists in the root directory
- Restart the dev server after adding the key
- Check that the key is correct (no extra spaces)

### Messages not appearing in real-time

- Check browser console for Ably connection errors
- Verify the API key is valid in Ably dashboard
- Check network tab for `/api/ably/token` requests

### Typing indicators not working

- Ensure both users are on the thread page
- Check that Ably connection is established (green "Online" indicator)

## Free Tier Limits

The free tier is perfect for development:

- **2M messages/month** - More than enough for testing
- **200 concurrent connections** - Supports many simultaneous users
- **200 channels** - Plenty for MVP

For production scaling, upgrade to a paid plan when needed.

## Next Steps

1. Set up your Ably account
2. Add `ABLY_API_KEY` to `.env.local`
3. Restart your dev server
4. Test real-time messaging!

## Documentation

- Ably Docs: https://ably.com/docs
- Ably React Guide: https://ably.com/docs/getting-started/react
- Ably Presence: https://ably.com/docs/presence-occupancy/presence

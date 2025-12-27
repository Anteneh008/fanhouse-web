# Knock.app Notifications Setup Guide

This guide explains how to set up and use the Knock.app notification system for FanHouse.

## Overview

Knock.app is the notification orchestration layer for FanHouse. It handles:
- **In-app notifications** - Displayed in the notification bell and notifications page
- **Email notifications** - SFW-only transactional emails
- **Future channels** - SMS, push notifications, etc.

## Features

✅ **Notification Types Supported:**
- New messages
- New posts from subscribed creators
- Subscription renewals
- Payment received (subscriptions, PPV, tips)
- New comments on posts
- New likes on posts
- Creator application approved/rejected
- Payout processed

✅ **User Preferences:**
- Per-channel preferences (email, in-app)
- Per-notification-type preferences
- Granular control over what notifications users receive

✅ **Real-time Updates:**
- Notification bell shows unread count
- Real-time notification delivery via Knock
- Mark as read functionality

## Setup Instructions

### 1. Sign Up for Knock.app

1. Go to [https://knock.app](https://knock.app)
2. Sign up for an account
3. Create a new project (or use existing)
4. Get your API keys from the dashboard

### 2. Environment Variables

Add these to your `.env.local` and Vercel:

```env
# Knock.app Configuration
KNOCK_API_KEY=sk_live_xxx  # Your Knock API key
KNOCK_SIGNING_KEY=xxx       # Your Knock webhook signing key (for webhook verification)
```

### 3. Database Setup

Run the notifications schema initialization:

```bash
# Initialize notifications tables
node scripts/init-notifications.js

# Or include in full schema initialization
node scripts/init-all-schemas.js
```

This creates:
- `notification_preferences` table
- `notifications` table
- Helper functions for unread counts and marking as read

### 4. Configure Knock Workflows

In your Knock dashboard, create workflows for each notification type:

#### Required Workflows:

1. **new_message**
   - Trigger: When a new message is sent
   - Channels: in_app, email
   - Email template: SFW message notification

2. **new_post**
   - Trigger: When a creator posts new content
   - Channels: in_app, email
   - Email template: SFW post notification (no explicit content)

3. **payment_received**
   - Trigger: When creator receives payment
   - Channels: in_app, email
   - Email template: Payment receipt

4. **new_comment**
   - Trigger: When someone comments on a post
   - Channels: in_app, email
   - Email template: SFW comment notification

5. **new_like**
   - Trigger: When someone likes a post
   - Channels: in_app, email
   - Email template: SFW like notification

6. **creator_approved**
   - Trigger: When creator application is approved
   - Channels: in_app, email
   - Email template: Approval notification

7. **creator_rejected**
   - Trigger: When creator application is rejected
   - Channels: in_app, email
   - Email template: Rejection notification

### 5. Configure Webhook

In your Knock dashboard:

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/webhooks/knock`
3. Copy the signing key to `KNOCK_SIGNING_KEY` in your `.env.local`
4. Select events to receive:
   - `workflow.run.completed`
   - `workflow.run.failed`
   - `channel_item.sent`
   - `channel_item.failed`

### 6. Email Provider Setup

Knock supports multiple email providers. For NSFW platforms, use providers that allow adult content:

**Recommended Providers:**
- **SendGrid** (if policy allows)
- **Mailgun**
- **Postmark**
- **AWS SES**

**Important:** All email content must be SFW (Safe For Work):
- ✅ "You have a new message" (no preview)
- ✅ "Receipt / subscription renewed"
- ❌ Explicit previews, explicit thumbnails, explicit subject lines

Configure your email provider in Knock dashboard under **Channels** → **Email**.

## Usage

### Sending Notifications

The system automatically sends notifications for:
- New messages (`app/api/messages/send/route.ts`)
- New posts (`app/api/creators/posts/route.ts`)
- New comments (`app/api/posts/[postId]/comments/route.ts`)
- New likes (`app/api/posts/[postId]/like/route.ts`)
- Payments (`app/api/webhooks/ccbill/route.ts`)
- Creator approvals/rejections (`app/api/admin/creators/[userId]/approve|reject/route.ts`)

### Manual Notification Sending

You can also send notifications manually:

```typescript
import { sendNotification } from '@/lib/knock';

await sendNotification({
  type: 'new_message',
  userId: 'user-id',
  title: 'New Message',
  message: 'You have a new message from Creator',
  relatedUserId: 'creator-id',
  relatedMessageId: 'message-id',
});
```

### Helper Functions

Use helper functions for common notification types:

```typescript
import {
  notifyNewMessage,
  notifyNewPost,
  notifyPaymentReceived,
  notifyNewComment,
  notifyNewLike,
  notifyCreatorApproved,
  notifyCreatorRejected,
} from '@/lib/knock';

// Notify about new message
await notifyNewMessage(recipientId, senderId, messageId, senderName);

// Notify about new post
await notifyNewPost(userId, creatorId, postId, creatorName);

// Notify about payment
await notifyPaymentReceived(creatorId, transactionId, amountCents, 'subscription');
```

## Frontend Components

### Notification Bell

The notification bell is automatically included in `DashboardNav`:

```tsx
import NotificationBell from '@/app/components/NotificationBell';

<NotificationBell />
```

Features:
- Shows unread count badge
- Dropdown with recent notifications
- Click to mark as read
- Navigate to related content

### Notifications Page

Users can view all notifications at `/notifications`:

- List of all notifications
- Mark all as read
- Click to navigate to related content
- Filter by read/unread

## API Endpoints

### Get Notifications
```
GET /api/notifications?limit=20&offset=0&unread_only=false
```

### Mark as Read
```
PATCH /api/notifications
Body: { notificationIds?: string[] }  // If empty, marks all as read
```

### Get Preferences
```
GET /api/notifications/preferences
```

### Update Preferences
```
PUT /api/notifications/preferences
Body: {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  newMessageEnabled?: boolean;
  // ... other preferences
}
```

## Mock Mode

If `KNOCK_API_KEY` is not set, the system runs in **mock mode**:
- Notifications are logged to console
- No actual Knock API calls are made
- Notifications are still stored in database
- Useful for development and testing

## Testing

### Test Notifications Locally

1. Set `KNOCK_API_KEY` to empty or use mock mode
2. Trigger actions that send notifications:
   - Send a message
   - Create a post
   - Like a post
   - Comment on a post
3. Check database for notifications:
   ```sql
   SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
   ```

### Test with Knock Sandbox

1. Use Knock's sandbox/test environment
2. Configure test workflows
3. Send test notifications
4. Verify delivery in Knock dashboard

## Troubleshooting

### Notifications Not Appearing

1. Check database: `SELECT * FROM notifications WHERE user_id = 'xxx'`
2. Check Knock dashboard for workflow runs
3. Check user preferences: `SELECT * FROM notification_preferences WHERE user_id = 'xxx'`
4. Check console logs for errors

### Email Not Sending

1. Verify email provider is configured in Knock
2. Check email provider logs
3. Verify user has `emailEnabled: true` in preferences
4. Check Knock dashboard for failed channel items

### Webhook Not Receiving Events

1. Verify webhook URL is correct in Knock dashboard
2. Check webhook signing key matches `KNOCK_SIGNING_KEY`
3. Check server logs for webhook errors
4. Verify webhook endpoint is accessible (HTTPS required)

## Security Considerations

- **Webhook Signature Verification**: Always verify Knock webhook signatures
- **HTTPS Only**: Webhook endpoint must use HTTPS
- **User Preferences**: Respect user notification preferences
- **SFW Email Content**: Never include explicit content in emails
- **Rate Limiting**: Consider rate limiting notification endpoints

## Next Steps

1. ✅ Set up Knock account
2. ✅ Configure workflows
3. ✅ Set up email provider
4. ✅ Configure webhook
5. ✅ Test notification flow
6. ✅ Customize email templates
7. ✅ Add SMS/push notifications (future)

## Documentation

- [Knock.app Documentation](https://docs.knock.app)
- [Knock Workflows Guide](https://docs.knock.app/workflows)
- [Knock Webhooks Guide](https://docs.knock.app/webhooks)
- [Knock Email Channels](https://docs.knock.app/channels/email)


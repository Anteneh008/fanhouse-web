import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import db from '@/lib/db';
import { getAblyClient, getThreadChannelName } from '@/lib/ably';
import { notifyNewMessage } from '@/lib/knock';

/**
 * Send a message
 * POST /api/messages/send
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { recipientId, content, messageType = 'text', mediaUrl = null, priceCents = 0 } = body;

    // Validate input
    const trimmedContent = content?.trim();
    if (!recipientId || !trimmedContent) {
      return NextResponse.json(
        { error: 'Recipient ID and content are required' },
        { status: 400 }
      );
    }

    if (user.id === recipientId) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      );
    }

    // Get recipient info
    const recipientResult = await db.query(
      'SELECT id, role FROM users WHERE id = $1',
      [recipientId]
    );

    if (recipientResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    const recipient = recipientResult.rows[0];

    // Determine fan and creator IDs
    let fanId: string;
    let creatorId: string;

    if (user.role === 'fan' && recipient.role === 'creator') {
      fanId = user.id;
      creatorId = recipient.id;
    } else if (user.role === 'creator' && recipient.role === 'fan') {
      fanId = recipient.id;
      creatorId = user.id;
    } else {
      return NextResponse.json(
        { error: 'Messages can only be sent between fans and creators' },
        { status: 400 }
      );
    }

    // Get or create thread
    let threadResult = await db.query(
      'SELECT id FROM message_threads WHERE fan_id = $1 AND creator_id = $2',
      [fanId, creatorId]
    );

    let threadId: string;

    if (threadResult.rows.length === 0) {
      // Create new thread
      const newThreadResult = await db.query(
        `INSERT INTO message_threads (fan_id, creator_id, last_message_preview)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [fanId, creatorId, trimmedContent.substring(0, 100)]
      );
      threadId = newThreadResult.rows[0].id;
    } else {
      threadId = threadResult.rows[0].id;
    }

    // Determine if this is a paid message
    const isPaid = priceCents > 0;
    let paymentStatus: string = 'free';
    let transactionId: string | null = null;

    if (isPaid) {
      // For paid messages, payment status starts as 'pending'
      paymentStatus = 'pending';
      // TODO: Create transaction and process payment
      // For now, we'll just mark it as pending
    }

    // Create message
    const messageResult = await db.query(
      `INSERT INTO messages (
        thread_id, sender_id, recipient_id, content, message_type, 
        media_url, price_cents, is_paid, payment_status, transaction_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
      threadId,
      user.id,
      recipientId,
      trimmedContent,
      messageType,
        mediaUrl,
        priceCents,
        isPaid,
        paymentStatus,
        transactionId,
      ]
    );

    const message = messageResult.rows[0];

    // Get sender profile info
    const senderProfileResult = await db.query(
      'SELECT display_name FROM creator_profiles WHERE user_id = $1',
      [user.id]
    );
    const senderDisplayName = senderProfileResult.rows[0]?.display_name || null;

    const messageResponse = {
      id: message.id,
      threadId: message.thread_id,
      senderId: message.sender_id,
      recipientId: message.recipient_id,
      content: message.content,
      messageType: message.message_type,
      mediaUrl: message.media_url,
      priceCents: message.price_cents,
      isPaid: message.is_paid,
      paymentStatus: message.payment_status,
      transactionId: message.transaction_id,
      isRead: message.is_read,
      readAt: message.read_at,
      createdAt: message.created_at,
      sender: {
        id: user.id,
        email: user.email,
        displayName: senderDisplayName,
      },
    };

    // Publish message to Ably channel for real-time delivery
    try {
      const ably = getAblyClient();
      if (ably) {
        const channel = ably.channels.get(getThreadChannelName(threadId));
        await channel.publish('message', messageResponse);
      }
    } catch (ablyError) {
      console.error('Ably publish error:', ablyError);
      // Continue even if Ably fails - message is saved in DB and will appear via optimistic update
    }

    // Send notification to recipient (async, don't wait)
    notifyNewMessage(
      recipientId,
      user.id,
      message.id,
      senderDisplayName || user.email
    ).catch((error) => {
      console.error('Failed to send notification:', error);
    });

    return NextResponse.json({
      message: messageResponse,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


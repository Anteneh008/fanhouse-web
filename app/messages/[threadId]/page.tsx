'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAbly } from '@/lib/hooks/useAbly';
import type { Types } from 'ably';

interface Message {
  id: string;
  senderId: string;
  content: string;
  messageType: string;
  mediaUrl: string | null;
  priceCents: number;
  isPaid: boolean;
  paymentStatus: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

interface Thread {
  id: string;
  fanId: string;
  creatorId: string;
  fan: {
    id: string;
    email: string;
    displayName: string | null;
  };
  creator: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

export default function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const router = useRouter();
  const [threadId, setThreadId] = useState<string>('');
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use Ably for real-time messaging
  const { ably, isConnected, typingUsers, sendTypingIndicator } = useAbly(threadId, {
    onMessage: (ablyMessage: Types.Message) => {
      const newMessage = ablyMessage.data as Message;
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    },
  });

  useEffect(() => {
    params.then((p) => {
      setThreadId(p.threadId);
      fetchThread(p.threadId);
    });
  }, [params]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Typing indicator
  useEffect(() => {
    if (content.trim() && sendTypingIndicator) {
      sendTypingIndicator(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (sendTypingIndicator) {
          sendTypingIndicator(false);
        }
      }, 1000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [content, sendTypingIndicator]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchThread = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/threads/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load thread');
      }

      setThread(data.thread);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thread');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || sending) return;

    setError('');
    setSending(true);

    // Stop typing indicator
    if (sendTypingIndicator) {
      sendTypingIndicator(false);
    }

    try {
      if (!thread) {
        throw new Error('Thread not loaded');
      }

      if (!thread.creatorId) {
        throw new Error('Creator ID not found in thread');
      }

      const recipientId = thread.creatorId;

      if (!recipientId) {
        throw new Error('Recipient ID is required');
      }

      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          content: trimmedContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setContent('');
      // Message will be added via Ably real-time update
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error && !thread) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/messages" className="text-blue-600 hover:text-blue-500">
            ← Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  const currentUser = thread?.fan;
  const otherUser = thread?.creator;
  const isOtherUserTyping = Array.from(typingUsers).some(
    (userId) => userId !== currentUser?.id
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                href="/messages"
                className="text-gray-400 hover:text-gray-600"
              >
                ←
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {otherUser?.displayName || otherUser?.email}
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">Creator</p>
                  {isConnected && (
                    <span className="text-xs text-green-600">● Online</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            const isOwn = message.senderId === currentUser?.id;

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {message.isPaid && message.paymentStatus === 'pending' && (
                    <div className="text-xs opacity-75 mb-1">
                      💰 Paid message - ${(message.priceCents / 100).toFixed(2)}
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.mediaUrl && (
                    <div className="mt-2">
                      <img
                        src={message.mediaUrl}
                        alt="Message media"
                        className="max-w-full h-auto rounded"
                      />
                    </div>
                  )}
                  <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
          {isOtherUserTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <p className="text-sm text-gray-500 italic">Typing...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!content.trim() || sending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

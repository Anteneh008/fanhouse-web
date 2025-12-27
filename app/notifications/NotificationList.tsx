'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  relatedUser?: {
    id: string;
    email: string;
    displayName?: string;
  };
  relatedPostId?: string;
  relatedMessageId?: string;
  relatedTransactionId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface NotificationListProps {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}

export default function NotificationList({
  initialNotifications,
  initialUnreadCount,
}: NotificationListProps) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const router = useRouter();

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }

    // Navigate based on notification type
    if (notification.relatedMessageId) {
      router.push(`/messages/${notification.relatedMessageId}`);
    } else if (notification.relatedPostId) {
      router.push(`/posts/${notification.relatedPostId}`);
    } else if (notification.type === 'creator_approved') {
      router.push('/creator/dashboard');
    } else if (notification.type === 'payment_received') {
      router.push('/creator/earnings');
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
      {unreadCount > 0 && (
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <p className="text-white/80 text-sm">
            {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
          </p>
          <button
            onClick={markAllAsRead}
            className="text-sm text-pink-400 hover:text-pink-300 font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-white/30 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p className="text-white/60 text-lg">No notifications yet</p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full p-6 text-left hover:bg-white/5 transition-colors ${
                !notification.isRead ? 'bg-white/5' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-3 h-3 rounded-full mt-2 shrink-0 ${
                    !notification.isRead ? 'bg-pink-400' : 'bg-transparent'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-white text-base">
                      {notification.title}
                    </p>
                    <span className="text-white/50 text-xs shrink-0 ml-4">
                      {new Date(notification.createdAt).toLocaleString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        }
                      )}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm">{notification.message}</p>
                  {notification.relatedUser && (
                    <p className="text-white/50 text-xs mt-2">
                      From: {notification.relatedUser.displayName || notification.relatedUser.email}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


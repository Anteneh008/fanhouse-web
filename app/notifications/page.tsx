import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import NotificationList from './NotificationList';
import DashboardNav from '@/app/components/DashboardNav';

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Get notifications
  const result = await db.query(
    `SELECT 
      n.*,
      u.email as related_user_email,
      cp.display_name as related_user_display_name
    FROM notifications n
    LEFT JOIN users u ON n.related_user_id = u.id
    LEFT JOIN creator_profiles cp ON u.id = cp.user_id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT 50`,
    [user.id]
  );

  // Get unread count
  const unreadResult = await db.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
    [user.id]
  );
  const unreadCount = parseInt(unreadResult.rows[0]?.count || '0', 10);

  const notifications = result.rows.map((row) => ({
    id: row.id,
    type: row.notification_type,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    readAt: row.read_at,
    relatedUser: row.related_user_id
      ? {
          id: row.related_user_id,
          email: row.related_user_email,
          displayName: row.related_user_display_name,
        }
      : null,
    relatedPostId: row.related_post_id,
    relatedMessageId: row.related_message_id,
    relatedTransactionId: row.related_transaction_id,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  }));

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <DashboardNav />
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-white/80 text-lg">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'All caught up!'}
          </p>
        </div>

        <NotificationList
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
        />
      </div>
    </div>
  );
}


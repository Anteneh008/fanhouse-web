import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import Link from 'next/link';

export default async function CreatorMessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'creator') {
    redirect('/become-creator');
  }

  if (user.creatorStatus !== 'approved') {
    redirect('/creator/status');
  }

  // Get message threads (conversations with fans)
  // For now, we'll show a placeholder since the messages table doesn't exist yet
  // This will be implemented when we build the messaging system

  // Get stats
  const statsResult = await db.query(
    `SELECT 
      COUNT(DISTINCT s.fan_id) as total_fans
    FROM subscriptions s
    WHERE s.creator_id = $1 AND s.status = 'active'`,
    [user.id]
  );

  const stats = {
    totalFans: parseInt(statsResult.rows[0]?.total_fans || '0'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-600">
            Communicate with your fans
          </p>
        </div>

        {/* Stats Card */}
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg p-6 max-w-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">M</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Conversations</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversations</h2>

          <div className="text-center py-12 text-gray-500">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No messages yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Messages from your fans will appear here
              </p>
              <div className="mt-6">
                <p className="text-xs text-gray-400">
                  Messaging system coming soon
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Messaging Features (Coming Soon)
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Direct messages with fans</li>
            <li>Paid messages (fans pay to message you)</li>
            <li>Message requests and approvals</li>
            <li>Real-time notifications</li>
            <li>Message history and search</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


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

  // Get message threads
  const threadsResult = await db.query(
    `SELECT 
      mt.*,
      uf.id as fan_id,
      uf.email as fan_email
    FROM message_threads mt
    INNER JOIN users uf ON mt.fan_id = uf.id
    WHERE mt.creator_id = $1 AND mt.is_archived_by_creator = false
    ORDER BY mt.last_message_at DESC`,
    [user.id]
  );

  const threads = threadsResult.rows;

  // Get stats
  const statsResult = await db.query(
    `SELECT 
      COUNT(DISTINCT mt.id) as total_threads,
      SUM(mt.creator_unread_count) as total_unread
    FROM message_threads mt
    WHERE mt.creator_id = $1 AND mt.is_archived_by_creator = false`,
    [user.id]
  );

  const stats = {
    totalThreads: parseInt(statsResult.rows[0]?.total_threads || '0'),
    totalUnread: parseInt(statsResult.rows[0]?.total_unread || '0'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-600">Communicate with your fans</p>
        </div>

        {/* Stats Card */}
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">M</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Conversations</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalThreads}</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unread Messages</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUnread}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Conversations</h2>
          </div>

          {threads.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {threads.map((thread: any) => (
                <Link
                  key={thread.id}
                  href={`/creator/messages/${thread.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="shrink-0">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600">
                          {(thread.fan_email || 'F')[0].toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Thread Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {thread.fan_email}
                        </p>
                        {thread.creator_unread_count > 0 && (
                          <span className="shrink-0 ml-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                            {thread.creator_unread_count}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {thread.last_message_preview || 'No messages yet'}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(thread.last_message_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function MessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Route to role-specific messages
  if (user.role === 'creator') {
    redirect('/creator/messages');
  }

  // Fan messages page
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-2 text-gray-600">
            Chat with creators
          </p>
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
                Start a conversation with a creator
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
            <li>Direct messages with creators</li>
            <li>Free and paid message options</li>
            <li>Real-time chat</li>
            <li>Message requests</li>
            <li>Read receipts and typing indicators</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


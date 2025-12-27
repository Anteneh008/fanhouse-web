import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";

export default async function CreatorMessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "creator") {
    redirect("/become-creator");
  }

  if (user.creatorStatus !== "approved") {
    redirect("/creator/status");
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
    totalThreads: parseInt(statsResult.rows[0]?.total_threads || "0"),
    totalUnread: parseInt(statsResult.rows[0]?.total_unread || "0"),
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="text-white/80 text-lg">Communicate with your fans</p>
        </div>

        {/* Stats Card */}
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-linear-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
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
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/70">
                    Active Conversations
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats.totalThreads}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
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
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/70">
                    Unread Messages
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats.totalUnread}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <svg
                className="w-6 h-6 text-pink-400"
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
              <span>Conversations</span>
            </h2>
          </div>

          {threads.length > 0 ? (
            <div className="divide-y divide-white/10">
              {threads.map(
                (thread: {
                  id: string;
                  fan_email: string;
                  creator_unread_count: number;
                  last_message_preview: string | null;
                  last_message_at: Date;
                }) => (
                  <Link
                    key={thread.id}
                    href={`/creator/messages/${thread.id}`}
                    className="block p-6 hover:bg-white/5 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="shrink-0">
                        <div className="w-14 h-14 rounded-full p-0.5 bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500">
                          <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-xl font-bold text-white">
                              {(thread.fan_email || "F")[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Thread Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-white truncate">
                            {thread.fan_email}
                          </p>
                          {thread.creator_unread_count > 0 && (
                            <span className="shrink-0 ml-2 bg-linear-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              {thread.creator_unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/70 truncate mb-1">
                          {thread.last_message_preview || "No messages yet"}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-white/50">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            {new Date(
                              thread.last_message_at
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white/40"
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
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">
                  No messages yet
                </h3>
                <p className="mt-2 text-sm text-white/70">
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

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import DashboardNav from "@/app/components/DashboardNav";

export default async function MessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Route to role-specific messages
  if (user.role === "creator") {
    redirect("/creator/messages");
  }

  // Get message threads
  const threadsResult = await db.query(
    `SELECT 
      mt.*,
      uc.id as creator_id,
      uc.email as creator_email,
      cpc.display_name as creator_display_name,
      cpc.profile_image_url as creator_avatar_url
    FROM message_threads mt
    INNER JOIN users uc ON mt.creator_id = uc.id
    LEFT JOIN creator_profiles cpc ON uc.id = cpc.user_id
    WHERE mt.fan_id = $1 AND mt.is_archived_by_fan = false
    ORDER BY mt.last_message_at DESC`,
    [user.id]
  );

  const threads = threadsResult.rows;

  return (
    <>
      <DashboardNav userRole={user.role} />
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Messages
            </h1>
            <p className="text-white/80 text-lg">Chat with creators</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
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
                    Conversations
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {threads.length}
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
                  <p className="text-3xl font-bold text-white">
                    {threads.reduce(
                      (sum, t) => sum + (t.fan_unread_count || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden shadow-xl border border-white/20">
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
                    creator_email: string;
                    creator_display_name: string | null;
                    creator_avatar_url: string | null;
                    fan_unread_count: number;
                    last_message_preview: string | null;
                    last_message_at: Date;
                  }) => (
                    <Link
                      key={thread.id}
                      href={`/messages/${thread.id}`}
                      className="block p-6 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        <div className="shrink-0">
                          <div className="w-16 h-16 rounded-full bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 p-0.5">
                            <div className="w-full h-full rounded-full bg-linear-to-r from-purple-900 to-blue-900 flex items-center justify-center overflow-hidden">
                              {thread.creator_avatar_url ? (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={thread.creator_avatar_url}
                                    alt={
                                      thread.creator_display_name ||
                                      thread.creator_email
                                    }
                                    fill
                                    className="object-cover rounded-full"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <span className="text-2xl font-bold text-white">
                                  {(thread.creator_display_name ||
                                    thread.creator_email)[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Thread Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-base font-bold text-white truncate">
                              {thread.creator_display_name ||
                                thread.creator_email}
                            </p>
                            {thread.fan_unread_count > 0 && (
                              <span className="shrink-0 ml-2 bg-linear-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                {thread.fan_unread_count}
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
                  <svg
                    className="mx-auto h-20 w-20 text-white/40"
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
                  <h3 className="mt-4 text-xl font-bold text-white">
                    No messages yet
                  </h3>
                  <p className="mt-2 text-sm text-white/70">
                    Start a conversation with a creator
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/creators"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span>Browse Creators</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

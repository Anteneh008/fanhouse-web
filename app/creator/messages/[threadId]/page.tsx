"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAbly, type AblyMessage } from "@/lib/hooks/useAbly";

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

export default function CreatorThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const [threadId, setThreadId] = useState<string>("");
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use Ably for real-time messaging
  const { isConnected, typingUsers, sendTypingIndicator } = useAbly(threadId, {
    onMessage: (ablyMessage: AblyMessage) => {
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchThread = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/threads/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load thread");
      }

      setThread(data.thread);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load thread");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || sending) return;

    setError("");
    setSending(true);

    // Stop typing indicator
    if (sendTypingIndicator) {
      sendTypingIndicator(false);
    }

    try {
      if (!thread) {
        throw new Error("Thread not loaded");
      }

      if (!thread.fanId) {
        throw new Error("Fan ID not found in thread");
      }

      const recipientId = thread.fanId;

      if (!recipientId) {
        throw new Error("Recipient ID is required");
      }

      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId,
          content: trimmedContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Add message to local state immediately (optimistic update)
      if (data.message && thread) {
        const newMessage: Message = {
          id: data.message.id,
          senderId: data.message.senderId,
          content: data.message.content,
          messageType: data.message.messageType,
          mediaUrl: data.message.mediaUrl,
          priceCents: data.message.priceCents,
          isPaid: data.message.isPaid,
          paymentStatus: data.message.paymentStatus,
          isRead: data.message.isRead,
          createdAt: data.message.createdAt,
          sender: data.message.sender || {
            id: data.message.senderId,
            email: thread.creator?.email || "",
            displayName: thread.creator?.displayName || null,
          },
        };
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }

      setContent("");
      // Message will also be added via Ably real-time update (for other clients)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white text-lg">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error && !thread) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 max-w-md mx-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-white/70 mb-6">{error}</p>
          <Link
            href="/creator/messages"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            ← Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  const currentUser = thread?.creator;
  const otherUser = thread?.fan;
  const isOtherUserTyping = Array.from(typingUsers).some(
    (userId) => userId !== currentUser?.id
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/creator/messages"
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-900 to-blue-900 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {otherUser?.email?.charAt(0).toUpperCase() || "F"}
                    </span>
                  </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">
                    {otherUser?.email || "Fan"}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
                      Fan
                    </span>
                    {isConnected && (
                      <span className="flex items-center space-x-1 text-xs text-green-400">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span>Online</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 max-w-md">
                <svg
                  className="w-16 h-16 text-white/40 mx-auto mb-4"
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
                <p className="text-white/70 text-lg">No messages yet</p>
                <p className="text-white/50 text-sm mt-2">
                  Start the conversation!
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === currentUser?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isOwn ? "justify-end" : "justify-start"
                  } items-end space-x-2`}
                >
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-0.5 shrink-0">
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-900 to-blue-900 flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">
                          {message.sender?.email?.charAt(0).toUpperCase() ||
                            "F"}
                        </span>
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                      isOwn
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : "bg-white/10 backdrop-blur-lg text-white border border-white/20"
                    }`}
                  >
                    {message.isPaid && message.paymentStatus === "pending" && (
                      <div className="flex items-center space-x-1 text-xs opacity-90 mb-2 bg-white/20 px-2 py-1 rounded-full inline-flex">
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
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          Paid - ${(message.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    {message.mediaUrl && (
                      <div className="mt-2 relative w-full rounded-lg overflow-hidden">
                        <div className="relative w-full h-64">
                          <Image
                            src={message.mediaUrl}
                            alt="Message media"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                    <p
                      className={`text-xs mt-2 flex items-center space-x-1 ${
                        isOwn ? "text-blue-100" : "text-white/60"
                      }`}
                    >
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
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>
                  {isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 p-0.5 shrink-0">
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-900 to-blue-900 flex items-center justify-center">
                        <span className="text-white font-semibold text-xs">
                          {currentUser?.email?.charAt(0).toUpperCase() || "C"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {isOtherUserTyping && (
            <div className="flex justify-start items-end space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-0.5 shrink-0">
                <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-900 to-blue-900 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {otherUser?.email?.charAt(0).toUpperCase() || "F"}
                  </span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl px-4 py-3 shadow-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-3 bg-red-500/20 border-t border-red-500/30 backdrop-blur-lg">
            <div className="flex items-center space-x-2 text-red-300">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-4 shadow-lg">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-white/50 transition-all duration-300"
                disabled={sending}
              />
            </div>
            <button
              type="submit"
              disabled={!content.trim() || sending}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 min-w-[100px]"
            >
              {sending ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
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
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  <span>Send</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

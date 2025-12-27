'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AuthNav from '@/app/components/AuthNav';
import Image from 'next/image';
import { useAbly } from '@/lib/hooks/useAbly';

interface Stream {
  id: string;
  title: string;
  description: string | null;
  status: string;
  visibilityType: 'free' | 'subscriber' | 'ppv';
  priceCents: number;
  viewerCount: number;
  playbackUrl: string | null;
  creator: {
    id: string;
    email: string;
    displayName: string | null;
    profileImageUrl: string | null;
  };
  hasAccess: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  isModerator: boolean;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

export default function StreamPage() {
  const router = useRouter();
  const params = useParams();
  const streamId = params?.streamId as string;
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [joined, setJoined] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Ably for live chat
  const { messages: ablyMessages } = useAbly(`stream:${streamId}:chat`, {
    onMessage: (message) => {
      if (message.data && typeof message.data === 'object') {
        const chatMsg = message.data as ChatMessage;
        setChatMessages((prev) => [...prev, chatMsg]);
      }
    },
  });

  useEffect(() => {
    if (streamId) {
      fetchStream();
      fetchChatMessages();
    }
  }, [streamId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchStream = async () => {
    try {
      const response = await fetch(`/api/creators/streams/${streamId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/streams');
          return;
        }
        throw new Error('Failed to fetch stream');
      }
      const data = await response.json();
      setStream(data.stream);

      // Join stream as viewer
      if (data.stream.status === 'live' && data.stream.hasAccess) {
        await joinStream();
      }
    } catch (error) {
      console.error('Failed to fetch stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const response = await fetch(`/api/streams/${streamId}/chat`);
      const data = await response.json();
      setChatMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
    }
  };

  const joinStream = async () => {
    try {
      const response = await fetch(`/api/streams/${streamId}/viewers`, {
        method: 'POST',
      });
      if (response.ok) {
        setJoined(true);
      }
    } catch (error) {
      console.error('Failed to join stream:', error);
    }
  };

  const leaveStream = async () => {
    try {
      await fetch(`/api/streams/${streamId}/viewers`, {
        method: 'DELETE',
      });
      setJoined(false);
    } catch (error) {
      console.error('Failed to leave stream:', error);
    }
  };

  const handleUnlock = async () => {
    if (!confirm(`Unlock this stream for $${(stream!.priceCents / 100).toFixed(2)}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/streams/${streamId}/unlock`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to unlock stream');
        return;
      }

      fetchStream();
    } catch (error) {
      console.error('Failed to unlock stream:', error);
      alert('Failed to unlock stream');
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/streams/${streamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to send message');
        return;
      }

      setChatInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    return () => {
      if (joined) {
        leaveStream();
      }
    };
  }, [joined]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
        <AuthNav />
        <div className="flex items-center justify-center h-screen">
          <p className="text-white/60">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
        <AuthNav />
        <div className="flex items-center justify-center h-screen">
          <p className="text-white/60">Stream not found</p>
        </div>
      </div>
    );
  }

  if (stream.status !== 'live') {
    return (
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
        <AuthNav />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-12 text-center">
            <p className="text-white/60 text-lg mb-4">This stream is not currently live</p>
            <button
              onClick={() => router.push('/streams')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all"
            >
              View Other Streams
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stream.hasAccess) {
    return (
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
        <AuthNav />
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">{stream.title}</h2>
            {stream.description && (
              <p className="text-white/70 mb-6">{stream.description}</p>
            )}
            {stream.visibilityType === 'ppv' ? (
              <>
                <p className="text-white/60 mb-6">
                  This is a pay-per-view stream. Unlock it to watch.
                </p>
                <button
                  onClick={handleUnlock}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold text-lg hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  Unlock for ${(stream.priceCents / 100).toFixed(2)}
                </button>
              </>
            ) : (
              <p className="text-white/60">
                You need to be subscribed to this creator to watch this stream.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <AuthNav />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-2xl overflow-hidden aspect-video relative">
              {stream.playbackUrl ? (
                <video
                  ref={videoRef}
                  src={stream.playbackUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                  playsInline
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-500">
                  <div className="text-center text-white">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                    <p className="text-lg font-semibold">Stream Starting...</p>
                    <p className="text-sm text-white/80 mt-2">Video player will appear here</p>
                  </div>
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full font-semibold">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </div>
              <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-full font-semibold">
                {stream.viewerCount} viewers
              </div>
            </div>

            {/* Stream Info */}
            <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
              <h1 className="text-3xl font-bold text-white mb-2">{stream.title}</h1>
              {stream.description && (
                <p className="text-white/70 mb-4">{stream.description}</p>
              )}
              <div className="flex items-center gap-3">
                {stream.creator.profileImageUrl ? (
                  <Image
                    src={stream.creator.profileImageUrl}
                    alt={stream.creator.displayName || stream.creator.email}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-semibold">
                    {stream.creator.displayName?.[0] || stream.creator.email[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold">
                    {stream.creator.displayName || stream.creator.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 flex flex-col h-[calc(100vh-8rem)]">
              <div className="p-4 border-b border-white/20">
                <h3 className="text-lg font-bold text-white">Live Chat</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold ${msg.isModerator ? 'text-pink-400' : 'text-white'}`}>
                          {msg.user?.displayName || msg.user?.email || 'Anonymous'}
                        </span>
                        {msg.isModerator && (
                          <span className="px-2 py-0.5 bg-pink-500/20 text-pink-300 rounded text-xs font-semibold">
                            MOD
                          </span>
                        )}
                      </div>
                      <p className="text-white/80 text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendChatMessage} className="p-4 border-t border-white/20">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400"
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || sending}
                    className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


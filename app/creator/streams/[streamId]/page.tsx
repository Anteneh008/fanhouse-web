'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardNav from '@/app/components/DashboardNav';
import Image from 'next/image';

interface Stream {
  id: string;
  title: string;
  description: string | null;
  streamKey: string;
  playbackUrl: string | null;
  rtmpUrl: string | null;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  visibilityType: 'free' | 'subscriber' | 'ppv';
  priceCents: number;
  viewerCount: number;
  peakViewerCount: number;
  startedAt: string | null;
  endedAt: string | null;
  replayUrl: string | null;
  creator: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

export default function StreamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params?.streamId as string;
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (streamId) {
      fetchStream();
    }
  }, [streamId]);

  const fetchStream = async () => {
    try {
      const response = await fetch(`/api/creators/streams/${streamId}`);
      if (!response.ok) {
        router.push('/creator/streams');
        return;
      }
      const data = await response.json();
      setStream(data.stream);
    } catch (error) {
      console.error('Failed to fetch stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartStream = async () => {
    try {
      const response = await fetch(`/api/creators/streams/${streamId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to start stream');
        return;
      }

      fetchStream();
    } catch (error) {
      console.error('Failed to start stream:', error);
      alert('Failed to start stream');
    }
  };

  const handleStopStream = async () => {
    if (!confirm('Are you sure you want to end this stream?')) {
      return;
    }

    try {
      const response = await fetch(`/api/creators/streams/${streamId}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to stop stream');
        return;
      }

      fetchStream();
    } catch (error) {
      console.error('Failed to stop stream:', error);
      alert('Failed to stop stream');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
        <DashboardNav userRole="creator" />
        <div className="flex items-center justify-center h-screen">
          <p className="text-white/60">Loading stream details...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
        <DashboardNav userRole="creator" />
        <div className="flex items-center justify-center h-screen">
          <p className="text-white/60">Stream not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <DashboardNav userRole="creator" />
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/creator/streams')}
          className="mb-6 text-white/80 hover:text-white flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Streams
        </button>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{stream.title}</h1>
              {stream.description && (
                <p className="text-white/70 mb-4">{stream.description}</p>
              )}
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 ${
                stream.status === 'live'
                  ? 'bg-red-500 text-white'
                  : stream.status === 'scheduled'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}
            >
              {stream.status.toUpperCase()}
            </span>
          </div>

          {/* Streaming Setup (for scheduled/live streams) */}
          {(stream.status === 'scheduled' || stream.status === 'live') && (
            <div className="mb-8 bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Streaming Setup</h2>
              
              {!stream.rtmpUrl ? (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
                  <p className="text-yellow-300 text-sm">
                    <strong>Note:</strong> Mux live streaming requires a paid plan. Your stream is created but you'll need to upgrade your Mux account or use a different streaming service to go live.
                  </p>
                  <p className="text-yellow-300/80 text-xs mt-2">
                    Stream Key: <code className="bg-black/30 px-2 py-1 rounded">{stream.streamKey}</code>
                  </p>
                </div>
              ) : (
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    RTMP Server
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value="rtmp://global-live.mux.com:5222/app"
                      readOnly
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                    <button
                      onClick={() => copyToClipboard('rtmp://global-live.mux.com:5222/app')}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Stream Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showStreamKey ? 'text' : 'password'}
                      value={stream.streamKey}
                      readOnly
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono"
                    />
                    <button
                      onClick={() => setShowStreamKey(!showStreamKey)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                    >
                      {showStreamKey ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(stream.streamKey)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-white text-sm">
                    <strong>OBS Setup:</strong> Go to Settings → Stream → Custom, then use the RTMP Server and Stream Key above.
                  </p>
                </div>
              </div>
              )}
            </div>
          )}

          {/* Stream Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Viewers</p>
              <p className="text-2xl font-bold text-white">{stream.viewerCount}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Peak Viewers</p>
              <p className="text-2xl font-bold text-white">{stream.peakViewerCount}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Visibility</p>
              <p className="text-lg font-semibold text-white capitalize">{stream.visibilityType}</p>
            </div>
            {stream.visibilityType === 'ppv' && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Price</p>
                <p className="text-lg font-semibold text-white">${(stream.priceCents / 100).toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {stream.status === 'scheduled' && (
              <button
                onClick={handleStartStream}
                className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all"
              >
                Start Stream
              </button>
            )}
            {stream.status === 'live' && (
              <>
                <button
                  onClick={() => router.push(`/streams/${stream.id}`)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
                >
                  Watch Stream
                </button>
                <button
                  onClick={handleStopStream}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all"
                >
                  End Stream
                </button>
              </>
            )}
            {stream.status === 'ended' && stream.replayUrl && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex-1">
                <p className="text-white/80 text-sm mb-2">Replay Available</p>
                <a
                  href={stream.replayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline"
                >
                  Watch Replay
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stream {
  id: string;
  title: string;
  description: string | null;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  visibilityType: 'free' | 'subscriber' | 'ppv';
  priceCents: number;
  viewerCount: number;
  startedAt: string | null;
  scheduledStartAt: string | null;
  playbackUrl: string | null;
  streamKey: string;
}

export default function CreatorStreamsPage() {
  const router = useRouter();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibilityType: 'free' as 'free' | 'subscriber' | 'ppv',
    priceCents: 0,
  });

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await fetch('/api/creators/streams');
      const data = await response.json();
      setStreams(data.streams || []);
    } catch (error) {
      console.error('Failed to fetch streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/creators/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create stream');
        return;
      }

      const data = await response.json();
      setShowCreateModal(false);
      setFormData({ title: '', description: '', visibilityType: 'free', priceCents: 0 });
      fetchStreams();
      router.push(`/creator/streams/${data.stream.id}`);
    } catch (error) {
      console.error('Failed to create stream:', error);
      alert('Failed to create stream');
    } finally {
      setCreating(false);
    }
  };

  const handleStartStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/creators/streams/${streamId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to start stream');
        return;
      }

      fetchStreams();
      router.push(`/creator/streams/${streamId}`);
    } catch (error) {
      console.error('Failed to start stream:', error);
      alert('Failed to start stream');
    }
  };

  const handleStopStream = async (streamId: string) => {
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

      fetchStreams();
    } catch (error) {
      console.error('Failed to stop stream:', error);
      alert('Failed to stop stream');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Live Streams
            </h1>
            <p className="text-white/80 text-lg">
              Create and manage your live streams
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-linear-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
          >
            + Go Live
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-white/60">Loading streams...</p>
          </div>
        ) : streams.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-12 text-center">
            <p className="text-white/60 text-lg mb-6">You haven&apos;t created any streams yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-linear-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all"
            >
              Create Your First Stream
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <div
                key={stream.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:border-pink-400/50 transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white truncate flex-1">
                      {stream.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ml-2 ${
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

                  {stream.description && (
                    <p className="text-white/70 text-sm mb-4 line-clamp-2">
                      {stream.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      {stream.viewerCount} viewers
                    </span>
                    <span className="capitalize">{stream.visibilityType}</span>
                    {stream.visibilityType === 'ppv' && (
                      <span>${(stream.priceCents / 100).toFixed(2)}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {stream.status === 'scheduled' && (
                      <button
                        onClick={() => handleStartStream(stream.id)}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all"
                      >
                        Start
                      </button>
                    )}
                    {stream.status === 'live' && (
                      <>
                        <button
                          onClick={() => router.push(`/streams/${stream.id}`)}
                          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleStopStream(stream.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all"
                        >
                          Stop
                        </button>
                      </>
                    )}
                    {(stream.status === 'scheduled' || stream.status === 'ended') && (
                      <button
                        onClick={() => router.push(`/creator/streams/${stream.id}`)}
                        className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-all"
                      >
                        {stream.status === 'scheduled' ? 'Setup' : 'View Details'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Stream Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-linear-to-br from-purple-900 to-indigo-900 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Create Live Stream</h2>
              <form onSubmit={handleCreateStream}>
                <div className="mb-4">
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400"
                    placeholder="Enter stream title"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400 resize-none"
                    rows={3}
                    placeholder="Describe your stream..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-white/80 text-sm font-semibold mb-2">
                    Visibility
                  </label>
                  <select
                    value={formData.visibilityType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visibilityType: e.target.value as 'free' | 'subscriber' | 'ppv',
                        priceCents: e.target.value === 'ppv' ? formData.priceCents : 0,
                      })
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-400"
                  >
                    <option value="free">Free (Everyone)</option>
                    <option value="subscriber">Subscribers Only</option>
                    <option value="ppv">Pay-Per-View</option>
                  </select>
                </div>

                {formData.visibilityType === 'ppv' && (
                  <div className="mb-6">
                    <label className="block text-white/80 text-sm font-semibold mb-2">
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.priceCents / 100}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priceCents: Math.round(parseFloat(e.target.value || '0') * 100),
                        })
                      }
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400"
                      placeholder="0.00"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-linear-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Stream'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


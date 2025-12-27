'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthNav from '@/app/components/AuthNav';
import Image from 'next/image';

interface Stream {
  id: string;
  title: string;
  description: string | null;
  status: string;
  visibilityType: 'free' | 'subscriber' | 'ppv';
  priceCents: number;
  viewerCount: number;
  startedAt: string | null;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
  creator: {
    id: string;
    email: string;
    displayName: string | null;
    profileImageUrl: string | null;
  };
  hasAccess: boolean;
}

export default function StreamsPage() {
  const router = useRouter();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
    // Refresh every 10 seconds to get updated viewer counts
    const interval = setInterval(fetchStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await fetch('/api/streams');
      const data = await response.json();
      setStreams(data.streams || []);
    } catch (error) {
      console.error('Failed to fetch streams:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <AuthNav />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Live Streams
          </h1>
          <p className="text-white/80 text-lg">
            Watch creators go live in real-time
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-white/60">Loading streams...</p>
          </div>
        ) : streams.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-12 text-center">
            <p className="text-white/60 text-lg">No live streams at the moment</p>
            <p className="text-white/40 text-sm mt-2">Check back later for new streams!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streams.map((stream) => (
              <div
                key={stream.id}
                onClick={() => router.push(`/streams/${stream.id}`)}
                className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:border-pink-400/50 transition-all cursor-pointer"
              >
                <div className="relative aspect-video bg-black">
                  {stream.thumbnailUrl ? (
                    <Image
                      src={stream.thumbnailUrl}
                      alt={stream.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-500">
                      <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </div>
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {stream.viewerCount} viewers
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                    {stream.title}
                  </h3>
                  {stream.description && (
                    <p className="text-white/70 text-sm mb-4 line-clamp-2">
                      {stream.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    {stream.creator.profileImageUrl ? (
                      <Image
                        src={stream.creator.profileImageUrl}
                        alt={stream.creator.displayName || stream.creator.email}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-semibold text-sm">
                        {stream.creator.displayName?.[0] || stream.creator.email[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {stream.creator.displayName || stream.creator.email}
                      </p>
                    </div>
                    {!stream.hasAccess && stream.visibilityType !== 'free' && (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-semibold">
                        {stream.visibilityType === 'ppv' ? `$${(stream.priceCents / 100).toFixed(2)}` : 'Subscriber Only'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


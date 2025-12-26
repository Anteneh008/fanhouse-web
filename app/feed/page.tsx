'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Post {
  id: string;
  creatorId: string;
  creator: {
    email: string;
    displayName: string | null;
  };
  content: string | null;
  visibilityType: string;
  priceCents: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  media: Array<{
    id: string;
    fileUrl: string;
    fileType: string;
    thumbnailUrl: string | null;
  }>;
  hasAccess: boolean;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/feed');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load feed');
      }

      setPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/unlock`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to unlock post');
        return;
      }

      // Refresh feed to show unlocked content
      fetchPosts();
    } catch (err) {
      alert('Failed to unlock post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchPosts}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feed</h1>
          <p className="mt-2 text-gray-600">
            Discover content from creators
          </p>
        </div>

        {/* Posts */}
        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {post.creator.displayName || post.creator.email}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          post.visibilityType === 'free'
                            ? 'bg-green-100 text-green-800'
                            : post.visibilityType === 'subscriber'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {post.visibilityType === 'ppv'
                          ? `PPV $${(post.priceCents / 100).toFixed(2)}`
                          : post.visibilityType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                {post.hasAccess ? (
                  <>
                    {post.content && (
                      <div className="p-4">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>
                    )}

                    {/* Media */}
                    {post.media.length > 0 && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-1 gap-2">
                          {post.media.map((media) => (
                            <div key={media.id} className="relative">
                              {media.fileType === 'image' ? (
                                <img
                                  src={media.fileUrl}
                                  alt="Post media"
                                  className="w-full h-auto rounded-lg"
                                />
                              ) : (
                                <div className="w-full bg-gray-200 rounded-lg aspect-video flex items-center justify-center">
                                  <span className="text-gray-500">Video</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="px-4 pb-4 flex items-center space-x-4 text-sm text-gray-500">
                      <button className="hover:text-gray-700">
                        ❤️ {post.likesCount}
                      </button>
                      <button className="hover:text-gray-700">
                        💬 {post.commentsCount}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="mb-4">
                        {post.media.length > 0 && post.media[0].thumbnailUrl && (
                          <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden mb-4">
                            <img
                              src={post.media[0].thumbnailUrl}
                              alt="Locked content"
                              className="w-full h-full object-cover blur-sm"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                              <div className="text-white text-center">
                                <svg
                                  className="mx-auto h-12 w-12 mb-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                  />
                                </svg>
                                <p className="font-medium">Locked Content</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {post.visibilityType === 'ppv'
                          ? `Unlock this post for $${(post.priceCents / 100).toFixed(2)}`
                          : post.visibilityType === 'subscriber'
                          ? 'Subscribe to view this content'
                          : 'This content is locked'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {post.visibilityType === 'ppv'
                          ? 'Purchase to unlock and view this exclusive content'
                          : 'Subscribe to this creator to access subscriber-only content'}
                      </p>
                      {post.visibilityType === 'ppv' && (
                        <button
                          onClick={() => handleUnlock(post.id)}
                          className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
                        >
                          Unlock for ${(post.priceCents / 100).toFixed(2)}
                        </button>
                      )}
                      {post.visibilityType === 'subscriber' && (
                        <Link
                          href={`/creators/${post.creatorId}`}
                          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                        >
                          Subscribe to View
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-500 mb-6">
              Be the first to create content!
            </p>
            <Link
              href="/creators"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Discover Creators
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


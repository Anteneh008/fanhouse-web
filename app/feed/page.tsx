"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import AuthNav from "@/app/components/AuthNav";

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
  isLiked?: boolean;
}

interface User {
  id: string;
  email: string;
  role: "fan" | "creator" | "admin";
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId: string | null;
  createdAt: string;
  user: {
    email: string;
    displayName: string | null;
  };
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentsOpen, setCommentsOpen] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [postingComment, setPostingComment] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUser();
    fetchPosts();
  }, []);

  const checkLikedStatus = useCallback(
    async (postId: string) => {
      if (!user) return;
      try {
        const res = await fetch(`/api/posts/${postId}/like`);
        if (res.ok) {
          const data = await res.json();
          setLikedPosts((prev) => {
            const newSet = new Set(prev);
            if (data.liked) {
              newSet.add(postId);
            } else {
              newSet.delete(postId);
            }
            return newSet;
          });
        }
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    },
    [user]
  );

  // Fetch liked status for all posts
  useEffect(() => {
    if (user && posts.length > 0) {
      posts.forEach((post) => {
        checkLikedStatus(post.id);
      });
    }
  }, [user, posts, checkLikedStatus]);

  const handleLike = async (postId: string) => {
    if (!user) {
      alert("Please log in to like posts");
      return;
    }

    const isLiked = likedPosts.has(postId);
    const method = isLiked ? "DELETE" : "POST";

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to like post");
        return;
      }

      const data = await res.json();

      // Update liked status
      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        if (data.liked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      // Update likes count in posts
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likesCount: data.likesCount } : post
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
      alert("Failed to like post");
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({
          ...prev,
          [postId]: data.comments || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const toggleComments = (postId: string) => {
    setCommentsOpen((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
        if (!comments[postId]) {
          fetchComments(postId);
        }
      }
      return newSet;
    });
  };

  const handleComment = async (postId: string) => {
    if (!user) {
      alert("Please log in to comment");
      return;
    }

    const text = commentText[postId]?.trim();
    if (!text || text.length === 0) {
      alert("Please enter a comment");
      return;
    }

    setPostingComment((prev) => new Set(prev).add(postId));

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: text }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to post comment");
        return;
      }

      const data = await res.json();

      // Clear comment input
      setCommentText((prev) => {
        const newText = { ...prev };
        delete newText[postId];
        return newText;
      });

      // Refresh comments
      await fetchComments(postId);

      // Update comments count
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentsCount: data.commentsCount }
            : post
        )
      );
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    } finally {
      setPostingComment((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch {
      // User not authenticated, that's okay
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/feed");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load feed");
      }

      const postsData = data.posts || [];
      setPosts(postsData);

      // Initialize liked posts from API response
      const likedSet = new Set<string>();
      postsData.forEach((post: Post) => {
        if (post.isLiked) {
          likedSet.add(post.id);
        }
      });
      setLikedPosts(likedSet);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/unlock`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to unlock post");
        return;
      }

      // Refresh feed to show unlocked content
      fetchPosts();
    } catch {
      alert("Failed to unlock post");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
        <AuthNav user={user} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={fetchPosts}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors backdrop-blur-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <AuthNav user={user} />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Your Feed
          </h1>
          <p className="text-white/80 text-lg">
            Discover exclusive content from creators
          </p>
        </div>

        {/* Posts */}
        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                {/* Post Header */}
                <div className="p-5 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-linear-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {(post.creator.displayName || post.creator.email)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {post.creator.displayName || post.creator.email}
                        </h3>
                        <p className="text-sm text-white/60">
                          {new Date(post.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-sm ${
                          post.visibilityType === "free"
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : post.visibilityType === "subscriber"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        }`}
                      >
                        {post.visibilityType === "ppv"
                          ? `🔒 PPV $${(post.priceCents / 100).toFixed(2)}`
                          : post.visibilityType === "subscriber"
                          ? "⭐ Subscriber Only"
                          : "🆓 Free"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                {post.hasAccess ? (
                  <>
                    {post.content && (
                      <div className="p-5">
                        <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                          {post.content}
                        </p>
                      </div>
                    )}

                    {/* Media - Only show if hasAccess is true */}
                    {post.hasAccess && post.media.length > 0 && (
                      <div className="px-5 pb-5">
                        <div className="grid grid-cols-1 gap-3">
                          {post.media.map((media) => (
                            <div
                              key={media.id}
                              className="relative rounded-xl overflow-hidden"
                            >
                              {media.fileType === "image" ? (
                                <div className="relative w-full aspect-auto">
                                  <Image
                                    src={media.fileUrl}
                                    alt="Post media"
                                    width={800}
                                    height={600}
                                    className="w-full h-auto rounded-xl object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="relative w-full aspect-video bg-black/20 rounded-xl overflow-hidden">
                                  <video
                                    src={media.fileUrl}
                                    poster={media.thumbnailUrl || undefined}
                                    controls
                                    className="w-full h-full object-cover"
                                    preload="metadata"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="px-5 pb-5 flex items-center space-x-6 text-sm border-t border-white/10 pt-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 transition-colors ${
                          likedPosts.has(post.id)
                            ? "text-pink-400 hover:text-pink-300"
                            : "text-white/70 hover:text-pink-400"
                        }`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill={
                            likedPosts.has(post.id) ? "currentColor" : "none"
                          }
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span className="font-medium">{post.likesCount}</span>
                      </button>
                      <button
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center space-x-2 transition-colors ${
                          commentsOpen.has(post.id)
                            ? "text-blue-400 hover:text-blue-300"
                            : "text-white/70 hover:text-blue-400"
                        }`}
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
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span className="font-medium">
                          {post.commentsCount}
                        </span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    {commentsOpen.has(post.id) && (
                      <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-4">
                        {/* Comment Form */}
                        {user && (
                          <div className="space-y-3">
                            <textarea
                              value={commentText[post.id] || ""}
                              onChange={(e) =>
                                setCommentText((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              placeholder="Write a comment..."
                              rows={3}
                              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all duration-300 resize-none"
                              maxLength={5000}
                            />
                            <button
                              onClick={() => handleComment(post.id)}
                              disabled={
                                postingComment.has(post.id) ||
                                !commentText[post.id]?.trim()
                              }
                              className="px-6 py-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                            >
                              {postingComment.has(post.id)
                                ? "Posting..."
                                : "Post Comment"}
                            </button>
                          </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {comments[post.id] && comments[post.id].length > 0 ? (
                            comments[post.id].map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {(
                                      comment.user.displayName ||
                                      comment.user.email
                                    )
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-semibold text-white text-sm">
                                        {comment.user.displayName ||
                                          comment.user.email}
                                      </span>
                                      <span className="text-xs text-white/50">
                                        {new Date(
                                          comment.createdAt
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          hour: "numeric",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-white/90 text-sm whitespace-pre-wrap overflow-wrap-anywhere">
                                      {comment.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-white/60 text-sm text-center py-4">
                              No comments yet. Be the first to comment!
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="mb-6">
                        {/* Only show thumbnail for locked content, never the actual video */}
                        {post.media.length > 0 &&
                          post.media[0].thumbnailUrl &&
                          !post.hasAccess && (
                            <div className="relative w-full h-64 rounded-xl overflow-hidden mb-4">
                              <Image
                                src={post.media[0].thumbnailUrl}
                                alt="Locked content"
                                fill
                                className="object-cover blur-md"
                                unoptimized
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                <div className="text-white text-center">
                                  <svg
                                    className="mx-auto h-16 w-16 mb-3 text-white/80"
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
                                  <p className="font-semibold text-lg">
                                    Locked Content
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">
                        {post.visibilityType === "ppv"
                          ? `Unlock this post for $${(
                              post.priceCents / 100
                            ).toFixed(2)}`
                          : post.visibilityType === "subscriber"
                          ? "Subscribe to view this content"
                          : "This content is locked"}
                      </h3>
                      <p className="text-sm text-white/70 mb-6">
                        {post.visibilityType === "ppv"
                          ? "Purchase to unlock and view this exclusive content"
                          : "Subscribe to this creator to access subscriber-only content"}
                      </p>
                      {post.visibilityType === "ppv" && (
                        <button
                          onClick={() => handleUnlock(post.id)}
                          className="px-8 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          🔓 Unlock for ${(post.priceCents / 100).toFixed(2)}
                        </button>
                      )}
                      {post.visibilityType === "subscriber" && (
                        <Link
                          href={`/creators/${post.creatorId}`}
                          className="inline-block px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          ⭐ Subscribe to View
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center border border-white/20 shadow-xl">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-white/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No posts yet
              </h3>
              <p className="text-white/70 mb-8 text-lg">
                Be the first to discover amazing creators!
              </p>
              <Link
                href="/creators"
                className="inline-block px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Discover Creators
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

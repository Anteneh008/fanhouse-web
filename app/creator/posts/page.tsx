import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export default async function CreatorPostsPage() {
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

  // Get all posts with media
  const postsResult = await db.query(
    `SELECT 
      p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', m.id,
            'fileUrl', m.file_url,
            'fileType', m.file_type,
            'thumbnailUrl', m.thumbnail_url,
            'sortOrder', m.sort_order
          ) ORDER BY m.sort_order
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'
      ) as media
    FROM posts p
    LEFT JOIN media_assets m ON p.id = m.post_id
    WHERE p.creator_id = $1
    GROUP BY p.id
    ORDER BY p.created_at DESC`,
    [user.id]
  );

  const posts = postsResult.rows.map((row) => ({
    id: row.id,
    content: row.content,
    visibilityType: row.visibility_type,
    priceCents: row.price_cents,
    isPinned: row.is_pinned,
    isDisabled: row.is_disabled,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    media: row.media || [],
  }));

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              My Posts
            </h1>
            <p className="text-white/80 text-lg">
              Manage your content and posts
            </p>
          </div>
          <Link
            href="/creator/posts/new"
            className="px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Create New Post</span>
          </Link>
        </div>

        {/* Posts List */}
        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row items-start gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-white line-clamp-2">
                        {post.content ? (
                          <span>{post.content}</span>
                        ) : (
                          <span className="text-white/50 italic">
                            No content
                          </span>
                        )}
                      </h3>
                      {post.isPinned && (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-semibold border border-yellow-500/30 flex items-center space-x-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          <span>Pinned</span>
                        </span>
                      )}
                      {post.isDisabled && (
                        <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-semibold border border-red-500/30 flex items-center space-x-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>Disabled</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                      <span
                        className={`px-3 py-1 rounded-full font-semibold ${
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
                          ? "⭐ Subscriber"
                          : "🆓 Free"}
                      </span>
                      <div className="flex items-center space-x-1 text-white/70">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{post.media.length} media</span>
                      </div>
                      <div className="flex items-center space-x-1 text-white/70">
                        <svg
                          className="w-4 h-4"
                          fill="none"
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
                        <span>{post.likesCount}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-white/70">
                        <svg
                          className="w-4 h-4"
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
                        <span>{post.commentsCount}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-white/70">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Media Preview */}
                    {post.media.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.media
                          .slice(0, 3)
                          .map(
                            (media: {
                              id: string;
                              fileUrl: string;
                              fileType: string;
                              thumbnailUrl?: string;
                            }) => (
                              <div
                                key={media.id}
                                className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 border border-white/10 relative"
                              >
                                {media.fileType === "image" ? (
                                  <Image
                                    src={media.fileUrl}
                                    alt="Post media"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="relative w-full h-full">
                                    {media.thumbnailUrl ? (
                                      <Image
                                        src={media.thumbnailUrl}
                                        alt="Video thumbnail"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-black/40" />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                        <svg
                                          className="w-4 h-4 text-white ml-0.5"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        {post.media.length > 3 && (
                          <div className="w-20 h-20 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              +{post.media.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <Link
                      href={`/creator/posts/${post.id}`}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold border border-white/20 transition-all duration-300 text-center"
                    >
                      View
                    </Link>
                    <Link
                      href={`/creator/posts/${post.id}/edit`}
                      className="px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-center"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 text-center shadow-xl border border-white/20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No posts yet
              </h3>
              <p className="text-white/70 mb-8 text-lg">
                Start creating content to engage with your fans
              </p>
              <Link
                href="/creator/posts/new"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Create Your First Post</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

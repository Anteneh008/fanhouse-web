import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export default async function CreatorPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "creator") {
    redirect("/become-creator");
  }

  const { postId } = await params;

  // Get post with media
  const postResult = await db.query(
    `SELECT 
      p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', m.id,
            'fileUrl', m.file_url,
            'fileType', m.file_type,
            'thumbnailUrl', m.thumbnail_url,
            'sortOrder', m.sort_order,
            'fileSize', m.file_size,
            'mimeType', m.mime_type
          ) ORDER BY m.sort_order
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'
      ) as media
    FROM posts p
    LEFT JOIN media_assets m ON p.id = m.post_id
    WHERE p.id = $1 AND p.creator_id = $2
    GROUP BY p.id`,
    [postId, user.id]
  );

  if (postResult.rows.length === 0) {
    redirect("/creator/posts");
  }

  const post = {
    id: postResult.rows[0].id,
    content: postResult.rows[0].content,
    visibilityType: postResult.rows[0].visibility_type,
    priceCents: postResult.rows[0].price_cents,
    isPinned: postResult.rows[0].is_pinned,
    isDisabled: postResult.rows[0].is_disabled,
    likesCount: postResult.rows[0].likes_count,
    commentsCount: postResult.rows[0].comments_count,
    createdAt: postResult.rows[0].created_at,
    updatedAt: postResult.rows[0].updated_at,
    media: postResult.rows[0].media || [],
  };

  // Get unlock count for PPV posts
  let unlockCount = 0;
  if (post.visibilityType === "ppv") {
    const unlockResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM entitlements 
       WHERE post_id = $1 AND entitlement_type = 'ppv_purchase'`,
      [postId]
    );
    unlockCount = parseInt(unlockResult.rows[0]?.count || "0");
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Post Details
              </h1>
              <p className="text-white/80 text-lg">View and manage your post</p>
            </div>
            <Link
              href="/creator/posts"
              className="inline-flex items-center space-x-2 text-white/80 hover:text-white font-medium transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to Posts</span>
            </Link>
          </div>
        </div>

        {/* Post Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-6">
          {/* Post Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`px-3 py-1.5 text-sm font-semibold rounded-full backdrop-blur-sm ${
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
                {post.isPinned && (
                  <span className="px-3 py-1.5 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-semibold border border-yellow-500/30 flex items-center space-x-1">
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
                  <span className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-full text-xs font-semibold border border-red-500/30 flex items-center space-x-1">
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
              <div className="flex items-center space-x-2 text-sm text-white/70">
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
                  {new Date(post.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Post Content */}
            {post.content && (
              <div className="mt-4">
                <p className="text-white/90 whitespace-pre-wrap leading-relaxed text-lg">
                  {post.content}
                </p>
              </div>
            )}
          </div>

          {/* Media */}
          {post.media.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-pink-400"
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
                <span>Media ({post.media.length})</span>
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {post.media.map(
                  (media: {
                    id: string;
                    fileUrl: string;
                    fileType: string;
                    thumbnailUrl?: string;
                  }) => (
                    <div
                      key={media.id}
                      className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10"
                    >
                      {media.fileType === "image" ? (
                        <div className="relative w-full aspect-square">
                          <Image
                            src={media.fileUrl}
                            alt="Post media"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-full aspect-square bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                          <div className="text-center">
                            <svg
                              className="w-12 h-12 mx-auto text-white/40 mb-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-white/60 text-xs font-medium">
                              Video
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Post Stats */}
          <div className="px-6 py-6 bg-white/5 border-t border-white/10">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                  <svg
                    className="w-5 h-5 text-pink-400"
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
                  <p className="text-sm text-white/70 font-medium">Likes</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {post.likesCount}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                  <svg
                    className="w-5 h-5 text-blue-400"
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
                  <p className="text-sm text-white/70 font-medium">Comments</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {post.commentsCount}
                </p>
              </div>
              {post.visibilityType === "ppv" && (
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                    <svg
                      className="w-5 h-5 text-purple-400"
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
                    <p className="text-sm text-white/70 font-medium">Unlocks</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{unlockCount}</p>
                </div>
              )}
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                  <svg
                    className="w-5 h-5 text-green-400"
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
                  <p className="text-sm text-white/70 font-medium">Media</p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {post.media.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-pink-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>Actions</span>
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/creator/posts/${postId}/edit`}
              className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Edit Post</span>
            </Link>
            <Link
              href={`/posts/${postId}`}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold border border-white/20 transition-all duration-300 flex items-center justify-center space-x-2"
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span>View as Fan</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { hasPostAccess } from "@/lib/entitlements";
import AuthNav from "@/app/components/AuthNav";

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const user = await getCurrentUser();
  const { postId } = await params;

  // Get post with creator info and media
  const postResult = await db.query(
    `SELECT 
      p.*,
      u.id as creator_id,
      u.email as creator_email,
      cp.display_name as creator_display_name,
      cp.profile_image_url as creator_avatar_url,
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
    INNER JOIN users u ON p.creator_id = u.id
    LEFT JOIN creator_profiles cp ON u.id = cp.user_id
    LEFT JOIN media_assets m ON p.id = m.post_id
    WHERE p.id = $1 AND p.is_disabled = false
    GROUP BY p.id, u.id, u.email, cp.display_name, cp.profile_image_url`,
    [postId]
  );

  if (postResult.rows.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <AuthNav user={user} />
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 max-w-md mx-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Post Not Found</h1>
          <p className="text-white/70 mb-6">
            This post doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/feed"
            className="inline-block px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const row = postResult.rows[0];
  const post = {
    id: row.id,
    creatorId: row.creator_id,
    creatorEmail: row.creator_email,
    creatorDisplayName: row.creator_display_name,
    creatorAvatarUrl: row.creator_avatar_url,
    content: row.content,
    visibilityType: row.visibility_type,
    priceCents: row.price_cents,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    createdAt: row.created_at,
    media: row.media || [],
  };

  // Check if user has access
  let hasAccess = false;
  if (user) {
    hasAccess = await hasPostAccess(user.id, postId);
  } else {
    // Non-authenticated users can only see free posts
    hasAccess = post.visibilityType === "free";
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <AuthNav user={user} />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/feed"
            className="inline-flex items-center space-x-2 text-white/80 hover:text-white font-medium mb-4 transition-colors"
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
            <span>Back to Feed</span>
          </Link>
        </div>

        {/* Post Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Creator Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-linear-to-r from-pink-500 to-purple-600 p-0.5 shrink-0">
                <div className="w-full h-full rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden relative">
                  {post.creatorAvatarUrl ? (
                    <Image
                      src={post.creatorAvatarUrl}
                      alt={post.creatorDisplayName || post.creatorEmail}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {(post.creatorDisplayName ||
                        post.creatorEmail)[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/creators/${post.creatorId}`}>
                  <h3 className="font-semibold text-white hover:text-pink-300 transition-colors">
                    {post.creatorDisplayName || post.creatorEmail}
                  </h3>
                </Link>
                <div className="flex items-center space-x-2 text-sm text-white/60 mt-1">
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
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
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

          {/* Post Content */}
          {hasAccess ? (
            <>
              {post.content && (
                <div className="p-6">
                  <p className="text-white/90 whitespace-pre-wrap leading-relaxed text-lg">
                    {post.content}
                  </p>
                </div>
              )}

              {/* Media */}
              {post.media.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 gap-4">
                    {post.media.map(
                      (media: {
                        id: string;
                        fileUrl: string;
                        fileType: string;
                        thumbnailUrl?: string;
                        sortOrder: number;
                      }) => (
                        <div
                          key={media.id}
                          className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10"
                        >
                          {media.fileType === "image" ? (
                            <div className="relative w-full aspect-auto">
                              <Image
                                src={media.fileUrl}
                                alt="Post media"
                                width={1200}
                                height={800}
                                className="w-full h-auto object-cover"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="relative w-full aspect-video bg-black/20 rounded-xl overflow-hidden">
                              <video
                                src={media.fileUrl}
                                poster={media.thumbnailUrl}
                                controls
                                className="w-full h-full object-cover"
                                preload="metadata"
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="px-6 pb-6 flex items-center space-x-6 text-sm">
                <button className="flex items-center space-x-2 text-white/70 hover:text-pink-400 transition-colors">
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
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="font-medium">{post.likesCount}</span>
                </button>
                <button className="flex items-center space-x-2 text-white/70 hover:text-blue-400 transition-colors">
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
                  <span className="font-medium">{post.commentsCount}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto">
                {post.media.length > 0 && post.media[0].thumbnailUrl && (
                  <div className="relative w-full h-64 rounded-xl overflow-hidden mb-6">
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
                        <p className="font-semibold text-lg">Locked Content</p>
                      </div>
                    </div>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-3">
                  {post.visibilityType === "ppv"
                    ? `Unlock this post for $${(post.priceCents / 100).toFixed(
                        2
                      )}`
                    : post.visibilityType === "subscriber"
                    ? "Subscribe to view this content"
                    : "This content is locked"}
                </h3>
                <p className="text-sm text-white/70 mb-6">
                  {post.visibilityType === "ppv"
                    ? "Purchase to unlock and view this exclusive content"
                    : "Subscribe to this creator to access subscriber-only content"}
                </p>
                {!user && (
                  <Link
                    href="/login"
                    className="inline-block px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold mb-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Login to Unlock
                  </Link>
                )}
                {user && post.visibilityType === "ppv" && (
                  <form action={`/api/posts/${postId}/unlock`} method="POST">
                    <button
                      type="submit"
                      className="px-8 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      Unlock for ${(post.priceCents / 100).toFixed(2)}
                    </button>
                  </form>
                )}
                {user && post.visibilityType === "subscriber" && (
                  <Link
                    href={`/creators/${post.creatorId}/subscribe`}
                    className="inline-block px-8 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Subscribe to View
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

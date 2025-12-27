"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface UploadedMedia {
  id?: string;
  fileUrl: string;
  fileType: "image" | "video";
  fileSize?: number;
  mimeType?: string;
  isExisting?: boolean;
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;

  const [content, setContent] = useState("");
  const [visibilityType, setVisibilityType] = useState<
    "free" | "subscriber" | "ppv"
  >("free");
  const [priceCents, setPriceCents] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  // Load existing post data
  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoadingPost(true);
        const res = await fetch(`/api/creators/posts/${postId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load post");
        }

        const post = data.post;
        setContent(post.content || "");
        setVisibilityType(post.visibilityType);
        setPriceCents(
          post.priceCents ? (post.priceCents / 100).toFixed(2) : ""
        );
        setUploadedMedia(
          (post.media || []).map((m: any) => ({
            id: m.id,
            fileUrl: m.fileUrl,
            fileType: m.fileType,
            isExisting: true,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoadingPost(false);
      }
    };

    if (postId) {
      loadPost();
    }
  }, [postId]);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadingFile(file.name);
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "type",
        file.type.startsWith("image/") ? "image" : "video"
      );

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadedMedia((prev) => [...prev, data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadingFile(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      handleFileUpload(file);
    });
  };

  const removeMedia = (index: number) => {
    setUploadedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate PPV price
      if (visibilityType === "ppv") {
        const price = parseFloat(priceCents);
        if (isNaN(price) || price < 0) {
          throw new Error("Please enter a valid price for PPV posts");
        }
      }

      // Update post
      const postRes = await fetch(`/api/creators/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim() || null,
          visibilityType,
          priceCents:
            visibilityType === "ppv"
              ? Math.round(parseFloat(priceCents) * 100)
              : 0,
        }),
      });

      const postData = await postRes.json();

      if (!postRes.ok) {
        throw new Error(postData.error || "Failed to update post");
      }

      // Handle new media uploads (existing media stays, new ones need to be added)
      const newMedia = uploadedMedia.filter((m) => !m.isExisting);
      if (newMedia.length > 0) {
        for (let i = 0; i < newMedia.length; i++) {
          const media = newMedia[i];
          const mediaRes = await fetch(`/api/creators/posts/${postId}/media`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileUrl: media.fileUrl,
              fileType: media.fileType,
              fileSize: media.fileSize,
              mimeType: media.mimeType,
              sortOrder: uploadedMedia.length - newMedia.length + i,
            }),
          });

          if (!mediaRes.ok) {
            console.error(`Failed to add media ${i + 1}`);
          }
        }
      }

      // Redirect to post detail
      router.push(`/creator/posts/${postId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Edit Post
              </h1>
              <p className="text-white/80 text-lg">
                Update your post content and settings
              </p>
            </div>
            <Link
              href={`/creator/posts/${postId}`}
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
              <span>Cancel</span>
            </Link>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <label
              htmlFor="content"
              className="block text-sm font-semibold text-white mb-3"
            >
              Content
            </label>
            <textarea
              id="content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent backdrop-blur-sm"
              placeholder="What's on your mind?"
            />
            <p className="mt-3 text-sm text-white/70">
              Optional: Add text to accompany your media
            </p>
          </div>

          {/* Media Upload */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <label className="block text-sm font-semibold text-white mb-3">
              Media
            </label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-3 text-white/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-white/80">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-white/60">
                    Images or Videos (MAX. 50MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Uploaded Media Preview */}
            {uploadedMedia.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {uploadedMedia.map((media, index) => (
                  <div key={index} className="relative group">
                    {media.fileType === "image" ? (
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                        <Image
                          src={media.fileUrl}
                          alt={`Media ${index + 1}`}
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
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    {media.isExisting && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500/80 text-white text-xs font-semibold rounded backdrop-blur-sm">
                        Existing
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {uploadingFile && (
              <div className="mt-4 text-sm text-white/70">
                Uploading {uploadingFile}...
              </div>
            )}
          </div>

          {/* Visibility Settings */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <label className="block text-sm font-semibold text-white mb-4">
              Visibility
            </label>
            <div className="space-y-4">
              <label className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  name="visibility"
                  value="free"
                  checked={visibilityType === "free"}
                  onChange={(e) => {
                    setVisibilityType(e.target.value as "free");
                    setPriceCents("");
                  }}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <span className="font-semibold text-white group-hover:text-pink-300 transition-colors">
                    Free
                  </span>
                  <p className="text-sm text-white/70">Visible to everyone</p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  name="visibility"
                  value="subscriber"
                  checked={visibilityType === "subscriber"}
                  onChange={(e) => {
                    setVisibilityType(e.target.value as "subscriber");
                    setPriceCents("");
                  }}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <span className="font-semibold text-white group-hover:text-pink-300 transition-colors">
                    Subscriber Only
                  </span>
                  <p className="text-sm text-white/70">
                    Only subscribers can view
                  </p>
                </div>
              </label>

              <label className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  name="visibility"
                  value="ppv"
                  checked={visibilityType === "ppv"}
                  onChange={(e) => setVisibilityType(e.target.value as "ppv")}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <span className="font-semibold text-white group-hover:text-pink-300 transition-colors">
                    Pay-Per-View (PPV)
                  </span>
                  <p className="text-sm text-white/70">
                    Fans pay to unlock this post
                  </p>
                  {visibilityType === "ppv" && (
                    <div className="mt-3 flex items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={priceCents}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            value === "" ||
                            /^\d*\.?\d*$/.test(value)
                          ) {
                            setPriceCents(value);
                          }
                        }}
                        placeholder="0.00"
                        className="w-32 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent backdrop-blur-sm"
                      />
                      <span className="ml-3 text-sm text-white/70 font-medium">
                        USD
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Link
              href={`/creator/posts/${postId}`}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold border border-white/20 transition-all duration-300 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {loading ? "Updating..." : "Update Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


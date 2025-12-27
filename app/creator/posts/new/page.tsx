"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { compressImage } from "@/lib/image-compression";

interface UploadedMedia {
  fileUrl: string;
  fileType: "image" | "video";
  fileSize: number;
  mimeType: string;
}

export default function NewPostPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [visibilityType, setVisibilityType] = useState<
    "free" | "subscriber" | "ppv"
  >("free");
  const [priceCents, setPriceCents] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadingFile(file.name);
      setError("");

      const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
      let fileToUpload = file;

      // Compress images before upload
      if (file.type.startsWith("image/")) {
        try {
          setUploadingFile(`Compressing ${file.name}...`);
          fileToUpload = await compressImage(file, 4);

          // Check size after compression
          if (fileToUpload.size > MAX_FILE_SIZE) {
            throw new Error(
              `File "${file.name}" is still too large after compression (${(
                fileToUpload.size /
                1024 /
                1024
              ).toFixed(2)}MB). Please use a smaller image.`
            );
          }
        } catch (compressionError) {
          console.error("Compression error:", compressionError);
          // If compression fails, check original size
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(
              `File "${file.name}" is too large (${(
                file.size /
                1024 /
                1024
              ).toFixed(2)}MB). Maximum size is ${
                MAX_FILE_SIZE / 1024 / 1024
              }MB.`
            );
          }
          // Use original file if compression fails but size is OK
          fileToUpload = file;
        }
      } else {
        // For videos, just check size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `File "${file.name}" is too large (${(
              file.size /
              1024 /
              1024
            ).toFixed(2)}MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
          );
        }
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append(
        "type",
        fileToUpload.type.startsWith("image/") ? "image" : "video"
      );

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        // Type assertion - API should return UploadedMedia
        const uploadedMedia: UploadedMedia = {
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
        };

        setUploadedMedia((prev) => [...prev, uploadedMedia]);
      } else {
        // If not JSON, it's likely an error page (e.g., 413 from Vercel)
        if (res.status === 413) {
          throw new Error(
            "File is too large. Maximum size is 4MB. Please compress your image or use a smaller file."
          );
        }
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }
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

    // Process all files (compression will happen in handleFileUpload)
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

      // Create post
      const postRes = await fetch("/api/creators/posts", {
        method: "POST",
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
        throw new Error(postData.error || "Failed to create post");
      }

      const postId = postData.post.id;

      // Add media to post
      if (uploadedMedia.length > 0) {
        for (let i = 0; i < uploadedMedia.length; i++) {
          const media = uploadedMedia[i];
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
              sortOrder: i,
            }),
          });

          if (!mediaRes.ok) {
            console.error(`Failed to add media ${i + 1}`);
          }
        }
      }

      // Redirect to posts list
      router.push("/creator/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Create New Post
              </h1>
              <p className="text-white/80 text-lg font-medium">
                Share content with your fans
              </p>
            </div>
            <Link
              href="/creator/posts"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold border border-white/30 transition-all duration-300 transform hover:scale-105"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
            <label
              htmlFor="content"
              className="flex items-center space-x-2 text-sm font-bold text-white mb-3"
            >
              <div className="p-1.5 rounded-lg bg-purple-500/20">
                <svg
                  className="w-4 h-4 text-purple-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span>Content</span>
            </label>
            <textarea
              id="content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 text-white placeholder-white/50 transition-all duration-300 resize-none hover:bg-white/15 hover:border-white/30"
              placeholder="What's on your mind?"
            />
            <p className="mt-3 text-xs text-white/60 flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Optional: Add text to accompany your media</span>
            </p>
          </div>

          {/* Media Upload */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
            <label className="flex items-center space-x-2 text-sm font-bold text-white mb-3">
              <div className="p-1.5 rounded-lg bg-blue-500/20">
                <svg
                  className="w-4 h-4 text-blue-300"
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
              <span>Media</span>
            </label>
            <div className="mt-2">
              <label
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                  uploading
                    ? "border-blue-400/50 bg-blue-500/10"
                    : "border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50"
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <svg
                      className="animate-spin w-10 h-10 mb-3 text-blue-300"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-12 h-12 mb-3 text-white/60"
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
                  )}
                  <p className="mb-2 text-sm text-white/90">
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
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {uploadedMedia.map((media, index) => (
                  <div key={index} className="relative group">
                    {media.fileType === "image" ? (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
                        <Image
                          src={media.fileUrl}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ) : (
                      <div className="w-full h-40 bg-linear-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border-2 border-white/20 shadow-lg">
                        <div className="text-center">
                          <svg
                            className="w-12 h-12 text-white/60 mx-auto mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-white/80 text-sm font-medium">
                            Video
                          </span>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-linear-to-r from-red-500 to-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 shadow-lg"
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
                  </div>
                ))}
              </div>
            )}

            {uploadingFile && (
              <div className="mt-4 flex items-center space-x-3 text-sm text-white/80 bg-blue-500/20 border border-blue-400/30 px-4 py-3 rounded-xl">
                <svg
                  className="animate-spin w-5 h-5 text-blue-300"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>
                  Uploading <strong>{uploadingFile}</strong>...
                </span>
              </div>
            )}
          </div>

          {/* Visibility Settings */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
            <label className="flex items-center space-x-2 text-sm font-bold text-white mb-4">
              <div className="p-1.5 rounded-lg bg-indigo-500/20">
                <svg
                  className="w-4 h-4 text-indigo-300"
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
              </div>
              <span>Visibility</span>
            </label>
            <div className="space-y-4">
              <label
                className={`flex items-start p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                  visibilityType === "free"
                    ? "bg-linear-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50"
                    : "bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="free"
                  checked={visibilityType === "free"}
                  onChange={(e) => {
                    setVisibilityType(e.target.value as "free");
                    setPriceCents("");
                  }}
                  className="mt-1 mr-4 w-5 h-5 text-green-500 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <svg
                      className="w-5 h-5 text-green-300"
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
                    <span className="font-bold text-white">Free</span>
                  </div>
                  <p className="text-sm text-white/70">Visible to everyone</p>
                </div>
              </label>

              <label
                className={`flex items-start p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                  visibilityType === "subscriber"
                    ? "bg-linear-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/50"
                    : "bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="subscriber"
                  checked={visibilityType === "subscriber"}
                  onChange={(e) => {
                    setVisibilityType(e.target.value as "subscriber");
                    setPriceCents("");
                  }}
                  className="mt-1 mr-4 w-5 h-5 text-purple-500 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <svg
                      className="w-5 h-5 text-purple-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="font-bold text-white">
                      Subscriber Only
                    </span>
                  </div>
                  <p className="text-sm text-white/70">
                    Only subscribers can view
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                  visibilityType === "ppv"
                    ? "bg-linear-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50"
                    : "bg-white/5 border-2 border-white/10 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="ppv"
                  checked={visibilityType === "ppv"}
                  onChange={(e) => setVisibilityType(e.target.value as "ppv")}
                  className="mt-1 mr-4 w-5 h-5 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-transparent"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <svg
                      className="w-5 h-5 text-yellow-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-bold text-white">
                      Pay-Per-View (PPV)
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mb-3">
                    Fans pay to unlock this post
                  </p>
                  {visibilityType === "ppv" && (
                    <div className="mt-3 flex items-center space-x-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-white/60 text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceCents}
                          onChange={(e) => setPriceCents(e.target.value)}
                          placeholder="0.00"
                          className="w-32 pl-7 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-400/50 text-white placeholder-white/50 transition-all duration-300"
                        />
                      </div>
                      <span className="text-sm text-white/70 font-medium">
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
            <div className="bg-linear-to-r from-red-500/20 to-red-600/20 border border-red-400/40 text-red-100 px-6 py-4 rounded-2xl backdrop-blur-sm flex items-center space-x-3 shadow-lg">
              <svg
                className="w-6 h-6 text-red-300 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <Link
              href="/creator/posts"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold border border-white/30 transition-all duration-300 transform hover:scale-105"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Cancel</span>
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="inline-flex items-center space-x-2 px-8 py-3 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:transform-none"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Creating...</span>
                </>
              ) : (
                <>
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
                  <span>Create Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

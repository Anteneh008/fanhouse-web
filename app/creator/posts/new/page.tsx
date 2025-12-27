"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create New Post
              </h1>
              <p className="mt-2 text-gray-600">Share content with your fans</p>
            </div>
            <Link
              href="/creator/posts"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              ← Back to Posts
            </Link>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content */}
          <div className="bg-white shadow rounded-lg p-6">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Content
            </label>
            <textarea
              id="content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="What's on your mind?"
            />
            <p className="mt-2 text-sm text-gray-500">
              Optional: Add text to accompany your media
            </p>
          </div>

          {/* Media Upload */}
          <div className="bg-white shadow rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media
            </label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-3 text-gray-400"
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
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
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
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {uploadedMedia.map((media, index) => (
                  <div key={index} className="relative group">
                    {media.fileType === "image" ? (
                      <div className="relative w-full h-32 rounded-lg overflow-hidden">
                        <Image
                          src={media.fileUrl}
                          alt={`Upload ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">Video</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
              <div className="mt-4 text-sm text-gray-500">
                Uploading {uploadingFile}...
              </div>
            )}
          </div>

          {/* Visibility Settings */}
          <div className="bg-white shadow rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Visibility
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  value="free"
                  checked={visibilityType === "free"}
                  onChange={(e) => {
                    setVisibilityType(e.target.value as "free");
                    setPriceCents("");
                  }}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium text-gray-900">Free</span>
                  <p className="text-sm text-gray-500">Visible to everyone</p>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  value="subscriber"
                  checked={visibilityType === "subscriber"}
                  onChange={(e) => {
                    setVisibilityType(e.target.value as "subscriber");
                    setPriceCents("");
                  }}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    Subscriber Only
                  </span>
                  <p className="text-sm text-gray-500">
                    Only subscribers can view
                  </p>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  value="ppv"
                  checked={visibilityType === "ppv"}
                  onChange={(e) => setVisibilityType(e.target.value as "ppv")}
                  className="mr-3"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">
                    Pay-Per-View (PPV)
                  </span>
                  <p className="text-sm text-gray-500">
                    Fans pay to unlock this post
                  </p>
                  {visibilityType === "ppv" && (
                    <div className="mt-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceCents}
                        onChange={(e) => setPriceCents(e.target.value)}
                        placeholder="0.00"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-500">USD</span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/creator/posts"
              className="px-6 py-3 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Creating..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

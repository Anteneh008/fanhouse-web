"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BecomeCreatorPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    role: string;
    creatorStatus: string | null;
  } | null>(null);

  useEffect(() => {
    // Check current status
    fetch("/api/creators/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.role === "creator") {
          setStatus(data);
          if (data.creatorStatus === "approved") {
            router.push("/creator/dashboard");
          }
        }
      })
      .catch(() => {
        // Not authenticated or error
      });
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/creators/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ displayName, bio }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Application failed");
        setIsLoading(false);
        return;
      }

      // Success - redirect to status page or dashboard
      router.push("/creator/status");
    } catch {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  // Show status if already applied
  if (status?.creatorStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-3xl font-bold text-center">
              Application Pending
            </h2>
            <p className="mt-2 text-center text-gray-600">
              Your creator application is under review
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            <p className="font-medium">Status: Pending Review</p>
            <p className="text-sm mt-1">
              We&apos;re reviewing your application. You&apos;ll be notified
              once a decision is made.
            </p>
          </div>
          <div className="text-center">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status?.creatorStatus === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-3xl font-bold text-center">
              Application Rejected
            </h2>
            <p className="mt-2 text-center text-gray-600">
              Your creator application was not approved
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            <p className="font-medium">Status: Rejected</p>
            <p className="text-sm mt-1">
              Your previous application was not approved. You can reapply below.
            </p>
          </div>
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Please review your information and submit a new application.
            </p>
            <button
              onClick={() => setStatus(null)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Reapply Now
            </button>
            <div>
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Become a Creator</h2>
          <p className="mt-2 text-center text-gray-600">
            Apply to start monetizing your content
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700"
              >
                Display Name *
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your creator name"
                maxLength={255}
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be your public creator name
              </p>
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700"
              >
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell fans about yourself..."
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-sm">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your application will be reviewed</li>
              <li>You&apos;ll need to complete identity verification</li>
              <li>Once approved, you can start monetizing</li>
            </ul>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Submitting..." : "Submit Application"}
            </button>
          </div>

          <div className="text-center text-sm">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-500"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

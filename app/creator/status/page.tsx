'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CreatorStatus {
  role: string;
  creatorStatus: string | null;
  profile: {
    display_name: string;
    bio: string | null;
  } | null;
  kyc: {
    status: string;
    rejectionReason: string | null;
  } | null;
}

export default function CreatorStatusPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CreatorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/creators/status')
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch status');
        }
        return res.json();
      })
      .then((data) => {
        setStatus(data);
        setLoading(false);

        // Redirect if approved
        if (data.creatorStatus === 'approved') {
          setTimeout(() => {
            router.push('/creator/dashboard');
          }, 2000);
        }
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
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

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-3xl font-bold text-center">Not a Creator</h2>
            <p className="mt-2 text-center text-gray-600">
              You haven&apos;t applied to become a creator yet
            </p>
          </div>
          <div className="text-center space-y-4">
            <Link
              href="/become-creator"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Apply to Become a Creator
            </Link>
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

  // Pending status
  if (status.creatorStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-3xl font-bold text-center">Application Pending</h2>
            <p className="mt-2 text-center text-gray-600">
              Your creator application is under review
            </p>
          </div>

          {status.profile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Your Application</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Display Name</dt>
                  <dd className="text-gray-900 font-medium">{status.profile.display_name}</dd>
                </div>
                {status.profile.bio && (
                  <div>
                    <dt className="text-gray-500">Bio</dt>
                    <dd className="text-gray-900">{status.profile.bio}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            <p className="font-medium">Status: Pending Review</p>
            <p className="text-sm mt-1">
              We&apos;re reviewing your application. You&apos;ll be notified once a decision is made.
            </p>
            {status.kyc && (
              <p className="text-sm mt-2">
                KYC Status: <span className="font-medium">{status.kyc.status}</span>
              </p>
            )}
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

  // Rejected status
  if (status.creatorStatus === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-3xl font-bold text-center">Application Rejected</h2>
            <p className="mt-2 text-center text-gray-600">
              Your creator application was not approved
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            <p className="font-medium">Status: Rejected</p>
            {status.kyc?.rejectionReason && (
              <p className="text-sm mt-1">
                <strong>Reason:</strong> {status.kyc.rejectionReason}
              </p>
            )}
            <p className="text-sm mt-2">
              You can reapply to become a creator. Please review the rejection reason and ensure your application meets our requirements.
            </p>
          </div>

          <div className="text-center space-y-3">
            <Link
              href="/become-creator"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Reapply to Become a Creator
            </Link>
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

  // Approved status
  if (status.creatorStatus === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-3xl font-bold text-center text-green-600">Application Approved!</h2>
            <p className="mt-2 text-center text-gray-600">
              Congratulations! You&apos;re now a creator
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            <p className="font-medium">Status: Approved</p>
            <p className="text-sm mt-1">
              You can now start creating content and monetizing your profile.
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Redirecting to your creator dashboard...
            </p>
              <div className="flex space-x-3">
                <Link
                  href="/creator/verify"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Complete Verification
                </Link>
                <Link
                  href="/creator/dashboard"
                  className="inline-block px-6 py-3 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 font-medium"
                >
                  Go to Dashboard
                </Link>
              </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Creator Status</h2>
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


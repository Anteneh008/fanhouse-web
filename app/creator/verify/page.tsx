'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface VerificationStatus {
  status: 'not_started' | 'pending' | 'approved' | 'rejected' | 'expired' | 'failed';
  inquiryId?: string;
  rejectionReason?: string;
  verifiedAt?: string;
}

export default function CreatorVerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/creators/verify');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch status');
      }

      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVerification = async () => {
    try {
      setStarting(true);
      setError('');

      const res = await fetch('/api/creators/verify', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start verification');
      }

      // Refresh status
      await fetchStatus();

      // In production, you would embed Persona's verification widget here
      // For now, we'll show a message
      alert(
        'Verification started! In production, Persona verification widget would appear here.\n\n' +
        'For development, the verification will be auto-approved after a few seconds.'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start verification');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  const currentStatus = status?.status || 'not_started';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
          <p className="mt-2 text-gray-600">
            Complete KYC verification to start monetizing your content
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Verification Status</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentStatus === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : currentStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : currentStatus === 'rejected' || currentStatus === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : currentStatus === 'expired'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {currentStatus === 'not_started'
                ? 'Not Started'
                : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </span>
          </div>

          {currentStatus === 'not_started' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                To start earning on FanHouse, you need to complete identity verification.
                This process includes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Government-issued ID verification</li>
                <li>Selfie verification</li>
                <li>Age verification (18+)</li>
              </ul>
              <button
                onClick={handleStartVerification}
                disabled={starting}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {starting ? 'Starting Verification...' : 'Start Verification'}
              </button>
            </div>
          )}

          {currentStatus === 'pending' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Your verification is in progress. Please complete the verification process.
              </p>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Development Mode:</strong> In production, Persona&apos;s verification
                  widget would be embedded here. For now, verification will be auto-approved.
                </p>
              </div>
              <button
                onClick={fetchStatus}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 font-medium"
              >
                Refresh Status
              </button>
            </div>
          )}

          {currentStatus === 'approved' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ Verification Approved
                </p>
                {status?.verifiedAt && (
                  <p className="text-sm text-green-700 mt-1">
                    Verified on {new Date(status.verifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <p className="text-gray-600">
                Your identity has been verified. You can now start monetizing your content!
              </p>
              <Link
                href="/creator/dashboard"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Go to Creator Dashboard
              </Link>
            </div>
          )}

          {(currentStatus === 'rejected' || currentStatus === 'failed') && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">
                  Verification {currentStatus === 'rejected' ? 'Rejected' : 'Failed'}
                </p>
                {status?.rejectionReason && (
                  <p className="text-sm text-red-700 mt-2">
                    <strong>Reason:</strong> {status.rejectionReason}
                  </p>
                )}
              </div>
              <p className="text-gray-600">
                Your verification was not successful. Please try again or contact support.
              </p>
              <button
                onClick={handleStartVerification}
                disabled={starting}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {starting ? 'Starting...' : 'Try Again'}
              </button>
            </div>
          )}

          {currentStatus === 'expired' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-800 font-medium">Verification Expired</p>
              </div>
              <p className="text-gray-600">
                Your verification session has expired. Please start a new verification.
              </p>
              <button
                onClick={handleStartVerification}
                disabled={starting}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {starting ? 'Starting...' : 'Start New Verification'}
              </button>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            About Identity Verification
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Verification is required before you can monetize content</li>
            <li>We use Persona for secure identity verification</li>
            <li>Your personal information is encrypted and secure</li>
            <li>Verification typically takes a few minutes</li>
            <li>You must be 18+ to become a creator</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


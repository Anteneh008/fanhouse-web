'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CancelSubscriptionFormProps {
  subscriptionId: string;
  creatorName: string;
  expiresAt: Date | string;
}

export default function CancelSubscriptionForm({
  subscriptionId,
  creatorName,
  expiresAt,
}: CancelSubscriptionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Redirect to subscriptions page
      router.push('/subscriptions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const expiresDate = new Date(expiresAt);
  const isExpiringSoon = expiresDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          What happens when you cancel:
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>You&apos;ll keep access until {expiresDate.toLocaleDateString()}</li>
          <li>Your subscription will not auto-renew</li>
          <li>You can resubscribe anytime</li>
          {isExpiringSoon && (
            <li className="text-yellow-600 font-medium">
              Your subscription expires soon
            </li>
          )}
        </ul>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Canceling...' : 'Cancel Subscription'}
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 font-medium"
        >
          Keep Subscription
        </button>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SubscribeFormProps {
  creatorId: string;
  priceCents: number;
}

export default function SubscribeForm({ creatorId, priceCents }: SubscribeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId,
          tierName: 'default',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      // If payment URL is returned, redirect to CCBill payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      // Otherwise, redirect to creator profile (mock payment flow)
      router.push(`/creators/${creatorId}?subscribed=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          What you&apos;ll get:
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>Access to all subscriber-only content</li>
          <li>Direct messaging with the creator</li>
          <li>Exclusive posts and updates</li>
          <li>Cancel anytime</li>
        </ul>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Processing...' : `Subscribe for $${(priceCents / 100).toFixed(2)}/month`}
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 font-medium"
        >
          Cancel
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-500 text-center">
        By subscribing, you agree to our terms of service. Subscription will auto-renew monthly until canceled.
      </p>
    </div>
  );
}


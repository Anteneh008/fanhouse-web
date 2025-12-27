'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MessageButtonProps {
  creatorId: string;
  className?: string;
}

export default function MessageButton({ creatorId, className }: MessageButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');

    try {
      // Create or get thread
      const res = await fetch('/api/messages/threads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ creatorId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start conversation');
      }

      // Navigate to the thread
      router.push(`/messages/${data.thread.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className || 'px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm'}
      >
        {loading ? 'Starting...' : '💬 Message'}
      </button>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </>
  );
}


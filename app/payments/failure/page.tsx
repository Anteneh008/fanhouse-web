import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

/**
 * Payment Failure Page
 * 
 * Users are redirected here if CCBill payment fails.
 * This page shows an error message and allows retry.
 */
export default async function PaymentFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const error = params.error as string | undefined;
  const creatorId = params.creatorId as string | undefined;

  // If we have a creator ID, redirect to subscription page with error
  if (creatorId) {
    redirect(`/creators/${creatorId}/subscribe?error=${error || 'payment_failed'}`);
  }

  // Otherwise, show error message
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
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
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-600 mb-6">
            {error === 'declined'
              ? 'Your payment was declined. Please check your payment method and try again.'
              : error === 'cancelled'
              ? 'Payment was cancelled. You can try again when ready.'
              : 'There was an issue processing your payment. Please try again or contact support.'}
          </p>
          <div className="space-y-3">
            <Link
              href="/creators"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
            >
              Browse Creators
            </Link>
            <Link
              href="/subscriptions"
              className="block w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 text-center"
            >
              View Subscriptions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


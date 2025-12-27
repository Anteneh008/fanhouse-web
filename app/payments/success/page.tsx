import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

/**
 * Payment Success Page
 * 
 * Users are redirected here after successful CCBill payment.
 * This page confirms the payment and redirects to the appropriate page.
 */
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  const subscriptionId = params.subscriptionId as string | undefined;
  const creatorId = params.creatorId as string | undefined;

  // If we have a creator ID, redirect to creator profile
  if (creatorId) {
    redirect(`/creators/${creatorId}?subscribed=true`);
  }

  // Otherwise, show success message
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment has been processed successfully. Your subscription is now active.
          </p>
          <div className="space-y-3">
            {subscriptionId && (
              <Link
                href="/subscriptions"
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
              >
                View Subscriptions
              </Link>
            )}
            <Link
              href="/feed"
              className="block w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 text-center"
            >
              Go to Feed
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


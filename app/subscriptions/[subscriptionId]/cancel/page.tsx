import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import CancelSubscriptionForm from './CancelSubscriptionForm';

export default async function CancelSubscriptionPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { subscriptionId } = await params;

  // Get subscription details
  const subscriptionResult = await db.query(
    `SELECT 
      s.*,
      u.email as creator_email,
      cp.display_name as creator_display_name
    FROM subscriptions s
    INNER JOIN users u ON s.creator_id = u.id
    LEFT JOIN creator_profiles cp ON u.id = cp.user_id
    WHERE s.id = $1 AND s.fan_id = $2`,
    [subscriptionId, user.id]
  );

  if (subscriptionResult.rows.length === 0) {
    redirect('/subscriptions');
  }

  const subscription = {
    id: subscriptionResult.rows[0].id,
    creatorId: subscriptionResult.rows[0].creator_id,
    creatorEmail: subscriptionResult.rows[0].creator_email,
    creatorDisplayName: subscriptionResult.rows[0].creator_display_name,
    tierName: subscriptionResult.rows[0].tier_name,
    priceCents: subscriptionResult.rows[0].price_cents,
    status: subscriptionResult.rows[0].status,
    expiresAt: subscriptionResult.rows[0].expires_at,
    autoRenew: subscriptionResult.rows[0].auto_renew,
  };

  if (subscription.status !== 'active') {
    redirect('/subscriptions');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Cancel Subscription
          </h1>

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-medium text-yellow-900 mb-2">
              Subscription to {subscription.creatorDisplayName || subscription.creatorEmail}
            </p>
            <p className="text-sm text-yellow-800">
              ${(subscription.priceCents / 100).toFixed(2)}/month
            </p>
          </div>

          <CancelSubscriptionForm
            subscriptionId={subscriptionId}
            creatorName={subscription.creatorDisplayName || subscription.creatorEmail}
            expiresAt={subscription.expiresAt}
          />
        </div>
      </div>
    </div>
  );
}


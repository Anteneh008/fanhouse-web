import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import SubscribeForm from './SubscribeForm';

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/creators');
  }

  const { creatorId } = await params;

  // Get creator profile
  const creatorResult = await db.query(
    `SELECT 
      u.id,
      u.email,
      cp.display_name,
      cp.subscription_price_cents
    FROM users u
    INNER JOIN creator_profiles cp ON u.id = cp.user_id
    WHERE u.id = $1 AND u.role = 'creator' AND u.creator_status = 'approved'`,
    [creatorId]
  );

  if (creatorResult.rows.length === 0) {
    redirect('/creators');
  }

  const creator = {
    id: creatorResult.rows[0].id,
    email: creatorResult.rows[0].email,
    displayName: creatorResult.rows[0].display_name,
    subscriptionPriceCents: creatorResult.rows[0].subscription_price_cents,
  };

  // Check if already subscribed
  const subscriptionResult = await db.query(
    'SELECT id FROM subscriptions WHERE fan_id = $1 AND creator_id = $2 AND status = $3',
    [user.id, creatorId, 'active']
  );

  if (subscriptionResult.rows.length > 0) {
    redirect(`/creators/${creatorId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Subscribe to {creator.displayName || creator.email}
          </h1>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Subscription Price</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  ${(creator.subscriptionPriceCents / 100).toFixed(2)}
                </p>
                <p className="text-sm text-blue-700 mt-1">per month</p>
              </div>
            </div>
          </div>

          <SubscribeForm creatorId={creatorId} priceCents={creator.subscriptionPriceCents} />
        </div>
      </div>
    </div>
  );
}


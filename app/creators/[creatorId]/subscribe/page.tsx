import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";
import SubscribeForm from "./SubscribeForm";

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/creators");
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
    redirect("/creators");
  }

  const creator = {
    id: creatorResult.rows[0].id,
    email: creatorResult.rows[0].email,
    displayName: creatorResult.rows[0].display_name,
    subscriptionPriceCents: creatorResult.rows[0].subscription_price_cents,
  };

  // Check if already subscribed
  const subscriptionResult = await db.query(
    "SELECT id FROM subscriptions WHERE fan_id = $1 AND creator_id = $2 AND status = $3",
    [user.id, creatorId, "active"]
  );

  if (subscriptionResult.rows.length > 0) {
    redirect(`/creators/${creatorId}`);
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-pink-500/30 to-purple-500/30 border border-pink-400/50 mb-4">
              <svg
                className="w-8 h-8 text-pink-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Subscribe to {creator.displayName || creator.email}
            </h1>
            <p className="text-white/80 text-lg">
              Get exclusive access to premium content
            </p>
          </div>

          {/* Price Card */}
          <div className="mb-8 p-6 bg-linear-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-2xl border border-blue-400/30 shadow-lg">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <svg
                    className="w-5 h-5 text-blue-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-blue-200 uppercase tracking-wide">
                    Subscription Price
                  </p>
                </div>
                <p className="text-5xl font-bold text-white mt-2">
                  ${(creator.subscriptionPriceCents / 100).toFixed(2)}
                </p>
                <p className="text-sm text-blue-200 mt-2 flex items-center justify-center space-x-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>per month</span>
                </p>
              </div>
            </div>
          </div>

          <SubscribeForm
            creatorId={creatorId}
            priceCents={creator.subscriptionPriceCents}
          />
        </div>
      </div>
    </div>
  );
}

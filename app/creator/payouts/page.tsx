'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Payout {
  id: string;
  amountCents: number;
  status: string;
  payoutMethod: string;
  createdAt: string;
  processedAt?: string;
}

export default function CreatorPayoutsPage() {
  const router = useRouter();
  const [earnings, setEarnings] = useState({ pendingEarningsCents: 0, totalEarningsCents: 0, totalPayoutsCents: 0 });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    amountDollars: '',
    payoutMethod: 'bank_transfer',
    payoutDetails: {} as Record<string, string>,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get earnings
      const earningsRes = await fetch('/api/creators/earnings');
      if (earningsRes.ok) {
        const earningsData = await earningsRes.json();
        setEarnings(earningsData.earnings);
      }

      // Get payouts
      const payoutsRes = await fetch('/api/creators/payouts/request');
      if (payoutsRes.ok) {
        const payoutsData = await payoutsRes.json();
        setPayouts(payoutsData.payouts || []);
      }
    } catch (err) {
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRequesting(true);

    // Convert dollars to cents
    const amountCents = Math.round(parseFloat(formData.amountDollars) * 100);

    if (!formData.amountDollars || isNaN(amountCents) || amountCents < 1000) {
      setError('Please enter a valid amount (minimum $10.00)');
      setRequesting(false);
      return;
    }

    try {
      const res = await fetch('/api/creators/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents,
          payoutMethod: formData.payoutMethod,
          payoutDetails: formData.payoutDetails,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request payout');
      }

      setShowRequestForm(false);
      setFormData({ amountDollars: '', payoutMethod: 'bank_transfer', payoutDetails: {} });
      await loadData(); // Reload data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
          <p className="mt-2 text-gray-600">Request payouts of your earnings</p>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm font-medium text-gray-500">Available Balance</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${(earnings.pendingEarningsCents / 100).toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm font-medium text-gray-500">Total Earned</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${(earnings.totalEarningsCents / 100).toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm font-medium text-gray-500">Total Paid Out</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${(earnings.totalPayoutsCents / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Request Payout Button */}
        {earnings.pendingEarningsCents >= 1000 && (
          <div className="mb-6">
            {!showRequestForm ? (
              <button
                onClick={() => setShowRequestForm(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Request Payout
              </button>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Payout</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRequestPayout} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (Minimum $10.00)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.amountDollars}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty, numbers, and one decimal point
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setFormData({ ...formData, amountDollars: value });
                          }
                        }}
                        placeholder="10.00"
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Available: ${(earnings.pendingEarningsCents / 100).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payout Method
                    </label>
                    <select
                      value={formData.payoutMethod}
                      onChange={(e) => setFormData({ ...formData, payoutMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="paxum">Paxum</option>
                      <option value="skrill">Skrill</option>
                      <option value="crypto">Crypto</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={requesting || !formData.amountDollars || parseFloat(formData.amountDollars || '0') < 10}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {requesting ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRequestForm(false);
                        setError('');
                        setFormData({ amountDollars: '', payoutMethod: 'bank_transfer', payoutDetails: {} });
                      }}
                      className="px-6 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Payout History */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payout History</h2>
          
          {payouts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payouts.map((payout) => (
                    <tr key={payout.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${(payout.amountCents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payout.payoutMethod.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No payout requests yet</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link
            href="/creator/earnings"
            className="text-blue-600 hover:text-blue-500"
          >
            ← Back to Earnings
          </Link>
        </div>
      </div>
    </div>
  );
}


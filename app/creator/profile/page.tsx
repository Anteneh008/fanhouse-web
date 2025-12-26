'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CreatorProfile {
  displayName: string;
  bio: string | null;
  subscriptionPriceCents: number;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
}

export default function CreatorProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<CreatorProfile>({
    displayName: '',
    bio: '',
    subscriptionPriceCents: 0,
    profileImageUrl: null,
    coverImageUrl: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/creators/profile');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load profile');
      }

      setProfile({
        displayName: data.profile?.displayName || '',
        bio: data.profile?.bio || '',
        subscriptionPriceCents: data.profile?.subscriptionPriceCents || 0,
        profileImageUrl: data.profile?.profileImageUrl || null,
        coverImageUrl: data.profile?.coverImageUrl || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch('/api/creators/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: profile.displayName.trim(),
          bio: profile.bio?.trim() || null,
          subscriptionPriceCents: Math.round(profile.subscriptionPriceCents),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <p className="mt-2 text-gray-600">
                Update your creator profile information
              </p>
            </div>
            <Link
              href="/creator/dashboard"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">Profile updated successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div className="bg-white shadow rounded-lg p-6">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              required
              value={profile.displayName}
              onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your display name"
              maxLength={255}
            />
            <p className="mt-2 text-sm text-gray-500">
              This is how your name appears to fans
            </p>
          </div>

          {/* Bio */}
          <div className="bg-white shadow rounded-lg p-6">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              rows={6}
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tell fans about yourself..."
            />
            <p className="mt-2 text-sm text-gray-500">
              Optional: Describe yourself and what fans can expect
            </p>
          </div>

          {/* Subscription Price */}
          <div className="bg-white shadow rounded-lg p-6">
            <label htmlFor="subscriptionPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Subscription Price *
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">$</span>
              <input
                type="number"
                id="subscriptionPrice"
                required
                step="0.01"
                min="0"
                value={(profile.subscriptionPriceCents / 100).toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setProfile({ ...profile, subscriptionPriceCents: value * 100 });
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              <span className="text-gray-500">USD/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Set your monthly subscription price. Fans will pay this amount to subscribe.
            </p>
          </div>

          {/* Profile Image (Placeholder) */}
          <div className="bg-white shadow rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Image
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Profile image upload coming soon
            </p>
            {profile.profileImageUrl && (
              <div className="w-24 h-24 bg-gray-300 rounded-full overflow-hidden">
                <img
                  src={profile.profileImageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Cover Image (Placeholder) */}
          <div className="bg-white shadow rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Cover image upload coming soon
            </p>
            {profile.coverImageUrl && (
              <div className="w-full h-48 bg-gray-300 rounded-lg overflow-hidden">
                <img
                  src={profile.coverImageUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/creator/dashboard"
              className="px-6 py-3 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * Get users endpoint (placeholder for future user management)
 * Currently returns empty array - extend this later for admin user management
 */
export async function GET() {
  try {
    // Require authentication
    await requireAuth();

    // TODO: Implement user listing with pagination, filters, etc.
    // For now, return empty array to prevent 404s
    return NextResponse.json({ users: [] });
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}


import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * Example protected API route
 * This demonstrates how to use requireAuth() to protect an API endpoint
 */
export async function GET() {
  try {
    // Require authentication - will throw if user is not authenticated
    const user = await requireAuth();

    return NextResponse.json({
      message: 'This is a protected endpoint',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}


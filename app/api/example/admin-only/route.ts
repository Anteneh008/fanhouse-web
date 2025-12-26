import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

/**
 * Example admin-only API route
 * This demonstrates how to use requireRole() to restrict access to admins
 */
export async function GET() {
  try {
    // Require admin role - will throw if user is not an admin
    const user = await requireRole('admin');

    return NextResponse.json({
      message: 'This endpoint is only accessible to admins',
      admin: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Access denied';
    const status = message === 'Unauthorized' ? 401 : 403;
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}


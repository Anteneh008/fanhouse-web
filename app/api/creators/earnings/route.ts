import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCreatorEarnings } from '@/lib/ledger';

/**
 * Get creator earnings summary
 * GET /api/creators/earnings
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'creator') {
      return NextResponse.json(
        { error: 'Only creators can view earnings' },
        { status: 403 }
      );
    }

    const earnings = await getCreatorEarnings(user.id);

    return NextResponse.json({ earnings });
  } catch (error) {
    console.error('Get earnings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


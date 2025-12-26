import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Enable a post (admin only)
 * POST /api/admin/posts/[postId]/enable
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await requireRole('admin');
    const { postId } = await params;

    await db.query(
      'UPDATE posts SET is_disabled = false WHERE id = $1',
      [postId]
    );

    return NextResponse.json({ message: 'Post enabled successfully' });
  } catch (error) {
    console.error('Enable post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


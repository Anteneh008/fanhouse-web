import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import db from '@/lib/db';

/**
 * Disable a post (admin only)
 * POST /api/admin/posts/[postId]/disable
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await requireRole('admin');
    const { postId } = await params;

    await db.query(
      'UPDATE posts SET is_disabled = true WHERE id = $1',
      [postId]
    );

    return NextResponse.json({ message: 'Post disabled successfully' });
  } catch (error) {
    console.error('Disable post error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


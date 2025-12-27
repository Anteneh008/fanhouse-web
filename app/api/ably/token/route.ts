import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAblyClient } from '@/lib/ably';

/**
 * Get Ably token for client-side authentication
 * GET /api/ably/token
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Request token from Ably
    const ably = getAblyClient();
    if (!ably) {
      return NextResponse.json(
        { error: 'Ably is not configured' },
        { status: 503 }
      );
    }

    const tokenRequest = await ably.auth.requestToken({
      clientId: user.id, // Use user ID as client ID for presence
      capability: {
        // Allow user to subscribe, publish, and use presence on any thread they're part of
        'thread:*': ['subscribe', 'presence', 'publish'],
        'presence:*': ['subscribe', 'presence'],
      },
    });

    return NextResponse.json({
      token: tokenRequest.token,
      issued: tokenRequest.issued,
      expires: tokenRequest.expires,
      capability: tokenRequest.capability,
      clientId: user.id, // Return clientId for presence
    });
  } catch (error) {
    console.error('Ably token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Ably token' },
      { status: 500 }
    );
  }
}


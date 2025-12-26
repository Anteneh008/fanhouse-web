import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { comparePassword, createToken, setAuthCookie } from '@/lib/auth';
import { User, JWTPayload } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const result = await db.query<User>(
      `SELECT id, email, password_hash as "passwordHash", role, creator_status as "creatorStatus", created_at as "createdAt"
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token with userId, role, and creatorStatus
    const payload: JWTPayload = {
      userId: user.id,
      role: user.role,
      creatorStatus: user.creatorStatus,
    };
    const token = createToken(payload);

    // Set HTTP-only cookie
    await setAuthCookie(token);

    // Return user data (without password hash)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        creatorStatus: user.creatorStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


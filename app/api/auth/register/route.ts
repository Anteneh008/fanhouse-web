import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with default role 'fan' and creatorStatus null
    const result = await db.query<User>(
      `INSERT INTO users (email, password_hash, role, creator_status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, creator_status as "creatorStatus", created_at as "createdAt"`,
      [email.toLowerCase(), passwordHash, 'fan', null]
    );

    const user = result.rows[0];

    // Create JWT token
    const payload: JWTPayload = {
      userId: user.id,
      role: user.role,
      creatorStatus: user.creatorStatus,
    };
    const token = createToken(payload);

    // Set HTTP-only cookie
    await setAuthCookie(token);

    // Return user data (without password hash)
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          creatorStatus: user.creatorStatus,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


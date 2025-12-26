# FanHouse Authentication System

A production-ready authentication system for Next.js App Router with PostgreSQL, JWT, and role-based access control.

## Features

- ✅ Email/password authentication
- ✅ bcrypt password hashing
- ✅ JWT tokens in HTTP-only cookies
- ✅ Role-based access control (fan, creator, admin)
- ✅ Protected routes with middleware
- ✅ Type-safe with TypeScript

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fanhouse_db

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-secret-key-change-in-production

# Node environment
NODE_ENV=development
```

**Important:** Generate a secure JWT_SECRET for production. You can use:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set Up the Database

Run the SQL schema to create the users table:

```bash
psql -U your_username -d fanhouse_db -f lib/db-schema.sql
```

Or manually execute the SQL in `lib/db-schema.sql` using your preferred PostgreSQL client.

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
├── app/
│   ├── api/auth/
│   │   ├── login/route.ts      # POST /api/auth/login
│   │   ├── register/route.ts   # POST /api/auth/register
│   │   ├── logout/route.ts     # POST /api/auth/logout
│   │   └── me/route.ts         # GET /api/auth/me
│   ├── login/page.tsx          # Login page
│   ├── register/page.tsx       # Registration page
│   ├── dashboard/page.tsx      # Protected dashboard
│   └── admin/page.tsx          # Admin-only page
├── lib/
│   ├── auth.ts                 # Auth utilities
│   ├── db.ts                   # Database connection
│   ├── db-schema.sql           # Database schema
│   └── types.ts                # TypeScript types
└── middleware.ts               # Route protection middleware
```

## API Endpoints

### POST /api/auth/register

Register a new user (default role: 'fan').

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "fan",
    "creatorStatus": null,
    "createdAt": "2025-12-26T00:00:00.000Z"
  }
}
```

### POST /api/auth/login

Authenticate user and issue JWT cookie.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "fan",
    "creatorStatus": null,
    "createdAt": "2025-12-26T00:00:00.000Z"
  }
}
```

### POST /api/auth/logout

Clear authentication cookie.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### GET /api/auth/me

Get current authenticated user.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "fan",
    "creatorStatus": null,
    "createdAt": "2025-12-26T00:00:00.000Z"
  }
}
```

## Auth Utilities

### getCurrentUser()

Get the currently authenticated user (returns null if not authenticated).

```typescript
import { getCurrentUser } from '@/lib/auth';

const user = await getCurrentUser();
if (user) {
  console.log(user.email, user.role);
}
```

### requireAuth()

Require authentication (throws error if not authenticated).

```typescript
import { requireAuth } from '@/lib/auth';

const user = await requireAuth(); // Throws if not authenticated
```

### requireRole(role)

Require specific role (throws error if user doesn't have the role).

```typescript
import { requireRole } from '@/lib/auth';

const user = await requireRole('admin'); // Throws if not admin
```

## Protected Routes

Routes are protected via middleware. Configure protected routes in `middleware.ts`:

```typescript
const protectedRoutes = ['/dashboard', '/profile', '/settings'];
const adminRoutes = ['/admin'];
```

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('fan', 'creator', 'admin')),
  creator_status VARCHAR(50) CHECK (creator_status IN ('pending', 'approved', 'rejected') OR creator_status IS NULL),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Security Considerations

1. **Passwords**: Hashed with bcrypt (10 rounds)
2. **JWT**: Stored in HTTP-only cookies (not accessible via JavaScript)
3. **Cookies**: 
   - `httpOnly: true` (prevents XSS attacks)
   - `secure: true` in production (HTTPS only)
   - `sameSite: 'lax'` (CSRF protection)
4. **Token Expiry**: 7 days
5. **Environment Variables**: Never commit `.env.local` to version control

## Creating an Admin User

To create an admin user, register normally and then manually update the role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000/register`
3. Create a new account
4. You'll be automatically logged in and redirected to `/dashboard`
5. Try accessing `/admin` (should be denied for non-admin users)

## Next Steps

This authentication system is Step 1 of a larger platform. Future enhancements might include:

- Email verification
- Password reset functionality
- Two-factor authentication (2FA)
- OAuth providers (Google, GitHub, etc.)
- Session management (multiple devices)
- Rate limiting for API endpoints
- Audit logging

## Troubleshooting

### "JWT_SECRET is not set" error
- Make sure `.env.local` exists and contains `JWT_SECRET`

### Database connection errors
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env.local`
- Ensure the database exists

### Middleware not working
- Clear browser cookies
- Restart the development server
- Check that `middleware.ts` is in the root directory

## License

MIT


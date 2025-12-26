# Quick Start Guide

Get your authentication system up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Git Bash or similar terminal (Windows) or standard terminal (Mac/Linux)

## Step 1: Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Edit `.env.local` with your database credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/fanhouse_db
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

**Important:** Generate a secure JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Database Setup

1. Create your PostgreSQL database:

```bash
createdb fanhouse_db
```

Or using psql:

```sql
CREATE DATABASE fanhouse_db;
```

2. Initialize the database schema:

```bash
npm run db:init
```

This creates the `users` table with the correct schema.

## Step 3: Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Step 4: Test the Authentication

### Register a New User

1. Navigate to `http://localhost:3000/register`
2. Enter an email and password (minimum 8 characters)
3. Click "Create Account"
4. You'll be automatically logged in and redirected to `/dashboard`

### Test Protected Routes

- `/dashboard` - Accessible to all authenticated users
- `/admin` - Only accessible to admin users (will redirect if not admin)

### Create an Admin User

To test admin functionality:

```bash
npm run db:create-admin admin@example.com SecurePassword123
```

Then login with these credentials and visit `/admin`.

## API Endpoints

Test the API endpoints using curl or Postman:

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

### Get Current User

```bash
curl http://localhost:3000/api/auth/me \
  -b cookies.txt
```

### Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

## Project Structure Overview

```
fanhouse-web/
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── dashboard/         # Protected dashboard
│   └── admin/             # Admin-only page
├── lib/
│   ├── auth.ts            # Auth utilities (getCurrentUser, requireAuth, etc.)
│   ├── db.ts              # Database connection
│   ├── db-schema.sql      # Database schema
│   └── types.ts           # TypeScript types
├── middleware.ts          # Route protection
└── scripts/
    ├── init-db.js         # Database initialization
    └── create-admin.js    # Admin user creation
```

## Common Issues

### "JWT_SECRET is not set"

Make sure `.env.local` exists and contains `JWT_SECRET`.

### Database connection errors

1. Verify PostgreSQL is running: `pg_isready`
2. Check your `DATABASE_URL` in `.env.local`
3. Ensure the database exists: `psql -l | grep fanhouse_db`

### Port already in use

If port 3000 is in use, specify a different port:

```bash
npm run dev -- -p 3001
```

## Next Steps

1. Read the full documentation in `README-AUTH.md`
2. Customize the UI in `app/login/page.tsx` and `app/register/page.tsx`
3. Add more protected routes in `middleware.ts`
4. Implement additional features (password reset, email verification, etc.)

## Security Checklist

Before deploying to production:

- [ ] Generate a strong JWT_SECRET (32+ random bytes)
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (cookies will be secure automatically)
- [ ] Review and update CORS settings if needed
- [ ] Set up proper database backups
- [ ] Implement rate limiting on auth endpoints
- [ ] Add logging and monitoring

## Support

For detailed documentation, see `README-AUTH.md`.

For issues or questions, check the code comments in:
- `lib/auth.ts` - Authentication utilities
- `middleware.ts` - Route protection logic
- `app/api/auth/*/route.ts` - API endpoint implementations


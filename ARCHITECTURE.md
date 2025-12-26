# Authentication System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Login    │  │  Register  │  │  Dashboard │            │
│  │    Page    │  │    Page    │  │    Page    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Middleware                      │
│  • Check authentication token                               │
│  • Verify JWT signature                                     │
│  • Enforce role-based access                                │
│  • Redirect unauthorized requests                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   /register  │  │    /login    │  │   /logout    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │     /me      │  │  /protected  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Auth Utilities Layer                      │
│  • getCurrentUser()  - Get authenticated user               │
│  • requireAuth()     - Enforce authentication               │
│  • requireRole()     - Enforce role-based access            │
│  • hashPassword()    - Hash passwords with bcrypt           │
│  • comparePassword() - Verify passwords                     │
│  • createToken()     - Generate JWT tokens                  │
│  • verifyToken()     - Validate JWT tokens                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (PostgreSQL)               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    users table                       │   │
│  │  • id (UUID, primary key)                           │   │
│  │  • email (VARCHAR, unique)                          │   │
│  │  • password_hash (VARCHAR)                          │   │
│  │  • role (fan | creator | admin)                     │   │
│  │  • creator_status (pending | approved | rejected)   │   │
│  │  • created_at (TIMESTAMP)                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Registration Flow

```
User                    API                     Database
  │                      │                          │
  │  POST /register      │                          │
  ├─────────────────────>│                          │
  │  {email, password}   │                          │
  │                      │                          │
  │                      │  Validate input          │
  │                      │  Hash password           │
  │                      │                          │
  │                      │  INSERT user             │
  │                      ├─────────────────────────>│
  │                      │                          │
  │                      │  Return user data        │
  │                      │<─────────────────────────┤
  │                      │                          │
  │                      │  Generate JWT            │
  │                      │  Set HTTP-only cookie    │
  │                      │                          │
  │  201 Created         │                          │
  │  Set-Cookie: token   │                          │
  │<─────────────────────┤                          │
  │                      │                          │
```

### Login Flow

```
User                    API                     Database
  │                      │                          │
  │  POST /login         │                          │
  ├─────────────────────>│                          │
  │  {email, password}   │                          │
  │                      │                          │
  │                      │  SELECT user             │
  │                      ├─────────────────────────>│
  │                      │                          │
  │                      │  Return user data        │
  │                      │<─────────────────────────┤
  │                      │                          │
  │                      │  Verify password         │
  │                      │  Generate JWT            │
  │                      │  Set HTTP-only cookie    │
  │                      │                          │
  │  200 OK              │                          │
  │  Set-Cookie: token   │                          │
  │<─────────────────────┤                          │
  │                      │                          │
```

### Protected Route Access

```
User                Middleware              API              Database
  │                      │                    │                  │
  │  GET /dashboard      │                    │                  │
  ├─────────────────────>│                    │                  │
  │  Cookie: token       │                    │                  │
  │                      │                    │                  │
  │                      │  Verify JWT        │                  │
  │                      │  Check expiration  │                  │
  │                      │                    │                  │
  │                      │  Token valid?      │                  │
  │                      │  ┌──────────┐     │                  │
  │                      │  │   YES    │     │                  │
  │                      │  └──────────┘     │                  │
  │                      │                    │                  │
  │                      │  Allow request     │                  │
  │                      ├───────────────────>│                  │
  │                      │                    │                  │
  │                      │                    │  SELECT user     │
  │                      │                    ├─────────────────>│
  │                      │                    │                  │
  │                      │                    │  Return user     │
  │                      │                    │<─────────────────┤
  │                      │                    │                  │
  │  200 OK              │                    │                  │
  │  Dashboard page      │                    │                  │
  │<─────────────────────┴────────────────────┤                  │
  │                                            │                  │
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         Registration                          │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Validate Input │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Hash Password  │
                    │   (bcrypt 10)   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Create User    │
                    │  role: fan      │
                    │  status: null   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Generate JWT   │
                    │  {userId, role} │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Set HTTP-only   │
                    │     Cookie      │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Return User Data│
                    └─────────────────┘
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Login   │  │ Register │  │Dashboard │  │  Admin   │   │
│  │  Page    │  │   Page   │  │   Page   │  │   Page   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
┌─────────────────────┼─────────────────────────────────────┐
│                     ▼                                      │
│              middleware.ts                                 │
│  • Intercepts all requests                                │
│  • Checks authentication                                  │
│  • Enforces role-based access                             │
└───────────────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│   API Routes   │         │  Server Pages   │
│  • /register   │         │  • /dashboard   │
│  • /login      │         │  • /admin       │
│  • /logout     │         └─────────────────┘
│  • /me         │                 │
└───────┬────────┘                 │
        │                          │
        └────────────┬─────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│                    lib/auth.ts                             │
│  • getCurrentUser()  • hashPassword()                      │
│  • requireAuth()     • comparePassword()                   │
│  • requireRole()     • createToken()                       │
│                      • verifyToken()                       │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│                    lib/db.ts                               │
│  PostgreSQL Connection Pool                                │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│                  PostgreSQL Database                        │
│                     users table                             │
└─────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Transport                        │
│  • HTTPS in production                                      │
│  • Secure cookies (secure flag)                             │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Layer 2: Cookie                           │
│  • HTTP-only (no JavaScript access)                         │
│  • SameSite: lax (CSRF protection)                          │
│  • 7-day expiration                                         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Layer 3: JWT                              │
│  • Signed with secret key                                   │
│  • Expiration validation                                    │
│  • Signature verification                                   │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Layer 4: Middleware                       │
│  • Route-level authentication                               │
│  • Role-based access control                                │
│  • Automatic redirects                                      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Layer 5: API/Page                         │
│  • requireAuth() for protected endpoints                    │
│  • requireRole() for admin endpoints                        │
│  • Input validation                                         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Layer 6: Database                         │
│  • Parameterized queries (SQL injection prevention)         │
│  • bcrypt password hashing                                  │
│  • Unique email constraint                                  │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
fanhouse-web/
│
├── app/                          # Next.js App Router
│   ├── api/auth/                 # Authentication API routes
│   │   ├── login/route.ts        # POST login endpoint
│   │   ├── register/route.ts     # POST register endpoint
│   │   ├── logout/route.ts       # POST logout endpoint
│   │   └── me/route.ts           # GET current user endpoint
│   │
│   ├── login/page.tsx            # Login page (client component)
│   ├── register/page.tsx         # Register page (client component)
│   ├── dashboard/page.tsx        # Protected dashboard (server component)
│   ├── admin/page.tsx            # Admin-only page (server component)
│   └── page.tsx                  # Home page with auth-aware UI
│
├── lib/                          # Core utilities
│   ├── auth.ts                   # Authentication utilities
│   ├── db.ts                     # Database connection
│   ├── db-schema.sql             # Database schema
│   └── types.ts                  # TypeScript type definitions
│
├── middleware.ts                 # Route protection middleware
│
├── scripts/                      # Utility scripts
│   ├── init-db.js                # Initialize database
│   └── create-admin.js           # Create admin user
│
└── Documentation/
    ├── QUICKSTART.md             # Quick start guide
    ├── README-AUTH.md            # Comprehensive documentation
    ├── IMPLEMENTATION-SUMMARY.md # Technical summary
    ├── SETUP-CHECKLIST.md        # Setup checklist
    └── ARCHITECTURE.md           # This file
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  • Next.js 16 (App Router)                                  │
│  • React 19                                                 │
│  • TypeScript 5                                             │
│  • Tailwind CSS 4                                           │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  • Next.js API Routes                                       │
│  • Node.js                                                  │
│  • TypeScript                                               │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Authentication                          │
│  • jsonwebtoken (JWT)                                       │
│  • bcrypt (password hashing)                                │
│  • HTTP-only cookies                                        │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
│  • PostgreSQL                                               │
│  • pg (node-postgres driver)                                │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. JWT in HTTP-only Cookies
**Why**: More secure than localStorage, automatic inclusion in requests, XSS protection

### 2. bcrypt for Password Hashing
**Why**: Industry standard, built-in salt, configurable work factor

### 3. Middleware for Route Protection
**Why**: Centralized logic, runs before page render, better UX

### 4. Server Components for Protected Pages
**Why**: Better performance, SEO-friendly, secure data fetching

### 5. Separate Auth Utilities Layer
**Why**: Reusable, testable, clean separation of concerns

### 6. Role-based Access Control
**Why**: Flexible permission system, easy to extend

### 7. PostgreSQL Database
**Why**: ACID compliance, robust, production-ready

## Scalability Considerations

```
Current Implementation (Step 1)
  ↓
Single Database Instance
  ↓
Future: Read Replicas
  ↓
Future: Redis for Session Cache
  ↓
Future: Horizontal Scaling
  ↓
Future: Microservices (if needed)
```

## Extension Points

The architecture is designed to be easily extensible:

1. **Add OAuth Providers**: Extend auth utilities with OAuth flows
2. **Add 2FA**: Add TOTP verification in login flow
3. **Add Email Verification**: Add email verification step after registration
4. **Add Password Reset**: Add password reset flow with time-limited tokens
5. **Add Session Management**: Add session tracking and revocation
6. **Add Rate Limiting**: Add rate limiting middleware
7. **Add Audit Logging**: Add logging layer for auth events

---

**Architecture Status**: ✅ Production-ready for Step 1

**Last Updated**: December 26, 2025


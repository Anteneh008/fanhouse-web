# Setup Checklist

Follow this checklist to get your authentication system running.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Git Bash or terminal access

## Setup Steps

### 1. Environment Configuration

- [ ] Create `.env.local` file in the root directory
- [ ] Add `DATABASE_URL` with your PostgreSQL connection string
- [ ] Generate and add secure `JWT_SECRET` (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] Set `NODE_ENV=development`

### 2. Database Setup

- [ ] Create PostgreSQL database: `createdb fanhouse_db`
- [ ] Run database initialization: `npm run db:init`
- [ ] Verify users table was created

### 3. Dependencies

- [ ] Dependencies are already installed (bcrypt, jsonwebtoken, pg, etc.)
- [ ] If needed, run: `npm install`

### 4. Start Development Server

- [ ] Run: `npm run dev`
- [ ] Open browser to `http://localhost:3000`
- [ ] Verify home page loads

### 5. Test Authentication

- [ ] Navigate to `/register`
- [ ] Create a test account
- [ ] Verify redirect to `/dashboard`
- [ ] Check that user info displays correctly
- [ ] Test logout functionality
- [ ] Navigate to `/login`
- [ ] Login with test account
- [ ] Verify redirect to `/dashboard`

### 6. Test Protected Routes

- [ ] While logged out, try to access `/dashboard` (should redirect to login)
- [ ] While logged out, try to access `/admin` (should redirect to login)
- [ ] While logged in as non-admin, try to access `/admin` (should redirect to home)

### 7. Create Admin User (Optional)

- [ ] Run: `npm run db:create-admin admin@example.com SecurePassword123`
- [ ] Login as admin
- [ ] Access `/admin` page
- [ ] Verify admin-only content displays

### 8. Test API Endpoints (Optional)

Using curl or Postman:

- [ ] POST `/api/auth/register` - Create user
- [ ] POST `/api/auth/login` - Login
- [ ] GET `/api/auth/me` - Get current user
- [ ] GET `/api/example/protected` - Test protected endpoint
- [ ] GET `/api/example/admin-only` - Test admin endpoint
- [ ] POST `/api/auth/logout` - Logout

### 9. Code Review

- [ ] Review `lib/auth.ts` - Understand auth utilities
- [ ] Review `middleware.ts` - Understand route protection
- [ ] Review `lib/types.ts` - Understand data models
- [ ] Review API routes in `app/api/auth/`

### 10. Documentation

- [ ] Read `QUICKSTART.md` for quick reference
- [ ] Read `README-AUTH.md` for comprehensive documentation
- [ ] Read `IMPLEMENTATION-SUMMARY.md` for technical details

## Verification Commands

```bash
# Check if PostgreSQL is running
pg_isready

# Check if database exists
psql -l | grep fanhouse_db

# Check if users table exists
psql fanhouse_db -c "\dt users"

# Check environment variables are loaded
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.JWT_SECRET ? '✅ JWT_SECRET loaded' : '❌ JWT_SECRET missing')"
```

## Common Issues & Solutions

### Issue: "JWT_SECRET is not set"
**Solution**: Create `.env.local` and add `JWT_SECRET=your-secret-here`

### Issue: Database connection error
**Solution**: 
1. Check PostgreSQL is running: `pg_isready`
2. Verify `DATABASE_URL` in `.env.local`
3. Ensure database exists: `createdb fanhouse_db`

### Issue: Port 3000 already in use
**Solution**: Use a different port: `npm run dev -- -p 3001`

### Issue: Module not found errors
**Solution**: Run `npm install` to install dependencies

### Issue: TypeScript errors
**Solution**: Restart your IDE/editor to reload TypeScript definitions

## Production Deployment Checklist

Before deploying to production:

- [ ] Generate strong JWT_SECRET (32+ bytes)
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (required for secure cookies)
- [ ] Set up SSL certificate
- [ ] Configure production database
- [ ] Set up database backups
- [ ] Add rate limiting to auth endpoints
- [ ] Set up monitoring and logging
- [ ] Review and test error handling
- [ ] Set up CI/CD pipeline
- [ ] Document deployment process
- [ ] Test all authentication flows in production environment

## Security Checklist

- [ ] JWT_SECRET is strong and random
- [ ] Passwords are hashed with bcrypt
- [ ] Cookies are HTTP-only
- [ ] Cookies are secure in production
- [ ] SQL queries use parameterized statements
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS is enforced in production
- [ ] Rate limiting is configured
- [ ] Database credentials are secure

## Success Criteria

You've successfully set up the authentication system when:

✅ Users can register and login  
✅ Protected routes redirect unauthenticated users  
✅ Admin routes are restricted to admins  
✅ JWT tokens are stored in HTTP-only cookies  
✅ Passwords are securely hashed  
✅ All API endpoints work correctly  
✅ No linter errors  
✅ No TypeScript errors  
✅ Documentation is clear and accessible  

---

**Need Help?**

- Check `QUICKSTART.md` for quick start guide
- Check `README-AUTH.md` for detailed documentation
- Check `IMPLEMENTATION-SUMMARY.md` for technical details
- Review code comments in `lib/auth.ts` and `middleware.ts`


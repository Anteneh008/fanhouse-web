# Quick Deployment Checklist

Follow these steps to deploy to Vercel:

## ✅ Pre-Deployment Checklist

- [ ] Code is committed and pushed to Git repository
- [ ] All TypeScript/build errors are fixed
- [ ] Database provider account created (Neon, Supabase, Railway, etc.)
- [ ] PostgreSQL database created and connection string ready
- [ ] JWT_SECRET generated (run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] Ably API key obtained (optional, for real-time messaging)

## 🚀 Deployment Steps

### 1. Push to Git
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Via Dashboard (Easiest)**
1. Go to https://vercel.com
2. Sign in with GitHub/GitLab/Bitbucket
3. Click "Add New..." → "Project"
4. Import your repository
5. Configure environment variables (see below)
6. Click "Deploy"

**Option B: Via CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### 3. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-generated-secret-here
NODE_ENV=production
ABLY_API_KEY=your-ably-key (optional)
```

### 4. Initialize Database

After deployment, run your database schema:

```bash
# Option 1: Using psql
psql $DATABASE_URL -f lib/db-schema.sql
psql $DATABASE_URL -f lib/db-schema-messaging.sql
psql $DATABASE_URL -f lib/db-schema-payouts.sql

# Option 2: Using your database provider's SQL editor
# Copy and paste the contents of each SQL file
```

### 5. Create Admin User (Optional)

```bash
# Set DATABASE_URL to your production database
export DATABASE_URL=your-production-database-url
npm run db:create-admin admin@example.com SecurePassword123
```

### 6. Verify Deployment

- [ ] Visit your deployed site
- [ ] Test user registration
- [ ] Test user login
- [ ] Test protected routes
- [ ] Check build logs for errors

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | Secret key for JWT tokens |
| `NODE_ENV` | ✅ Yes | Set to `production` |
| `ABLY_API_KEY` | ❌ No | For real-time messaging features |

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Database Providers**:
  - Neon: https://neon.tech
  - Supabase: https://supabase.com
  - Railway: https://railway.app
  - Render: https://render.com

## ⚠️ Important Notes

1. **Database**: Vercel doesn't provide PostgreSQL. You need an external provider.
2. **Environment Variables**: Must be set in Vercel Dashboard, not in `.env` files.
3. **Database Schema**: Must be run manually after deployment.
4. **SSL**: Automatically handled by Vercel.
5. **Custom Domain**: Can be added in Settings → Domains.

## 🆘 Need Help?

See `VERCEL-DEPLOYMENT.md` for detailed instructions.


# Vercel Deployment Guide

This guide will help you deploy your FanHouse Next.js application to Vercel.

## Prerequisites

1. **Git Repository**: Your code must be pushed to GitHub, GitLab, or Bitbucket
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Cloud Database**: You'll need a PostgreSQL database (see Database Setup below)

## Step 1: Prepare Your Repository

1. Make sure all your code is committed and pushed to your Git repository:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

## Step 2: Set Up Cloud PostgreSQL Database

Vercel doesn't provide PostgreSQL hosting. You'll need a cloud database provider:

### Option A: Vercel Postgres (Recommended)
- Go to your Vercel project → Storage → Create Database
- Select "Postgres"
- Copy the connection string

### Option B: Other Providers
- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier available
- **Railway** (https://railway.app) - Free tier available
- **Render** (https://render.com) - Free tier available

After creating your database, you'll need to:
1. Run your database migrations/schema
2. Copy the connection string (it will look like: `postgresql://user:password@host:5432/database`)

## Step 3: Deploy to Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel**: Visit [vercel.com](https://vercel.com) and sign in
2. **Import Project**: Click "Add New..." → "Project"
3. **Select Repository**: Choose your Git provider and select your repository
4. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (if your app is at the root)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
5. **Add Environment Variables** (see Step 4 below)
6. **Deploy**: Click "Deploy"

### Method 2: Via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts** to link your project

## Step 4: Environment Variables

Add these environment variables in Vercel (Settings → Environment Variables):

### Required Variables

```env
# Database Connection
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secret (generate a secure random string)
JWT_SECRET=your-secure-random-secret-key-here

# Node Environment
NODE_ENV=production
```

### Optional Variables

```env
# Ably API Key (for real-time messaging)
ABLY_API_KEY=your-ably-api-key-here

# CCBill Integration (if using)
CCBILL_CLIENT_ACCOUNT_NUMBER=your-ccbill-account-number
CCBILL_CLIENT_SUB_ACCOUNT_NUMBER=your-ccbill-sub-account-number
CCBILL_SALT_KEY=your-ccbill-salt-key
```

### Generate JWT_SECRET

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET`.

### Setting Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

## Step 5: Initialize Database Schema

After deployment, you need to run your database migrations. You have a few options:

### Option A: Run Locally (Recommended)

1. Set your local `.env.local` to point to your production database:
   ```env
   DATABASE_URL=your-production-database-url
   ```

2. Run the initialization script:
   ```bash
   npm run db:init
   ```

3. Or manually run the SQL files:
   ```bash
   psql $DATABASE_URL -f lib/db-schema.sql
   psql $DATABASE_URL -f lib/db-schema-messaging.sql
   psql $DATABASE_URL -f lib/db-schema-payouts.sql
   ```

### Option B: Use Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Run commands with environment variables:
   ```bash
   vercel env pull .env.local
   npm run db:init
   ```

### Option C: Use Database Provider's SQL Editor

Most database providers (Neon, Supabase, etc.) have a SQL editor where you can paste and run your schema files.

## Step 6: Create Admin User (Optional)

After setting up the database, create an admin user:

```bash
# Set your production DATABASE_URL locally
export DATABASE_URL=your-production-database-url

# Run the create-admin script
npm run db:create-admin admin@example.com SecurePassword123
```

## Step 7: Verify Deployment

1. **Check Build Logs**: In Vercel Dashboard → Deployments, check that the build succeeded
2. **Visit Your Site**: Click on the deployment to open your live site
3. **Test Authentication**: 
   - Try registering a new user
   - Try logging in
   - Test protected routes

## Step 8: Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. SSL certificates are automatically provisioned

## Troubleshooting

### Build Fails

- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript errors are fixed
- Check that environment variables are set correctly

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check that your database allows connections from Vercel's IPs
- Some providers require IP whitelisting (check your database provider's settings)
- For Neon/Supabase: Make sure to use the connection pooler URL if available

### Environment Variables Not Working

- Make sure variables are set for the correct environment (Production/Preview/Development)
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

### Real-time Features Not Working

- Verify `ABLY_API_KEY` is set
- Check Ably dashboard for API key validity
- Ensure Ably free tier limits aren't exceeded

## Post-Deployment Checklist

- [ ] Database schema initialized
- [ ] Environment variables configured
- [ ] Admin user created (if needed)
- [ ] Test user registration
- [ ] Test user login
- [ ] Test protected routes
- [ ] Test real-time messaging (if Ably is configured)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic with Vercel)

## Continuous Deployment

Vercel automatically deploys when you push to your main branch:
- **Production**: Deploys from `main` branch
- **Preview**: Deploys from other branches and pull requests

## Monitoring

- **Analytics**: Vercel provides built-in analytics
- **Logs**: View function logs in Vercel Dashboard → Functions
- **Errors**: Check Vercel Dashboard → Errors for runtime errors

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions


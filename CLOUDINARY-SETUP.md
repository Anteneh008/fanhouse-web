# Cloudinary Setup Guide

To fix the "read-only filesystem" error on Vercel, you need to set up Cloudinary for file uploads.

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account (25GB storage, 25GB bandwidth/month)
3. After signing up, you'll see your dashboard

## Step 2: Get Your Cloudinary Credentials

1. In your Cloudinary dashboard, go to **Settings** (gear icon)
2. Scroll down to **Product Environment Credentials**
3. You'll see:
   - **Cloud name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

## Step 3: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add the following three variables:

   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. Make sure to add them for **Production**, **Preview**, and **Development** environments
5. Click **Save**

## Step 4: Redeploy Your Application

After adding the environment variables, you need to redeploy:

1. Go to your Vercel project dashboard
2. Click on **Deployments**
3. Click the **⋯** (three dots) on the latest deployment
4. Click **Redeploy**

Or simply push a new commit to trigger a new deployment.

## Step 5: Test the Upload

1. Try uploading an image or video
2. The file should now upload successfully to Cloudinary
3. The file URL will be a Cloudinary CDN URL (e.g., `https://res.cloudinary.com/your-cloud-name/image/upload/...`)

## Local Development

For local development, you can either:

### Option A: Use Cloudinary (Recommended)

Add the same environment variables to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Option B: Use Local Filesystem (Development Only)

If you don't set Cloudinary variables, it will try to use the local filesystem. This only works locally, not on Vercel.

## Troubleshooting

### Error: "Cloudinary is not configured"

- Make sure all three environment variables are set
- Check that the variable names are exactly: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Redeploy after adding environment variables

### Error: "Invalid API credentials"

- Double-check your API Key and API Secret from Cloudinary dashboard
- Make sure there are no extra spaces in the environment variables

### Files still not uploading

- Check Vercel logs for detailed error messages
- Verify your Cloudinary account is active
- Check your Cloudinary usage limits (free tier has limits)

## Cloudinary Free Tier Limits

- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month
- **Uploads**: 500MB max file size

For production, you may need to upgrade to a paid plan as you scale.

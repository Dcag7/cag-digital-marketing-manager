# Vercel Setup Guide

This guide will help you connect your GitHub repository to Vercel and configure everything.

## Step 1: Login to Vercel CLI

```bash
vercel login
```

This will open your browser. Log in with your Vercel account.

## Step 2: Link Your Project

You have two options:

### Option A: Via Vercel Dashboard (Recommended for first-time setup)

1. Go to https://vercel.com/dashboard
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select **"cag-digital-marketing-manager"** from the list
5. Click **"Import"**
6. Configure project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
7. **Don't deploy yet** - we'll add environment variables first

### Option B: Via CLI

```bash
# Link the project
vercel link

# Follow the prompts:
# - Set up and deploy? No (we'll add env vars first)
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? cag-digital-marketing-manager
# - Directory? ./
```

## Step 3: Add Environment Variables

### Method 1: Via Vercel Dashboard (Easiest)

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable one by one (see list below)
4. Make sure to select **Production**, **Preview**, and **Development** for each

### Method 2: Via Vercel CLI

```bash
# Add each variable (example)
vercel env add DATABASE_URL
vercel env add DIRECT_URL
# ... etc for each variable
```

### Required Environment Variables

**Generate secrets first:**
```bash
npm run secrets:generate
```

**Then add all these variables:**

1. **Database URLs** (from Neon):
   - `DATABASE_URL` - Pooled connection
   - `DIRECT_URL` - Direct connection

2. **Clerk** (from https://dashboard.clerk.com):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app`

3. **Secrets** (generated):
   - `ENCRYPTION_KEY` - From `npm run secrets:generate`
   - `CRON_SECRET` - From `npm run secrets:generate`

4. **Integrations** (from respective dashboards):
   - `META_APP_ID`
   - `META_APP_SECRET`
   - `SHOPIFY_API_KEY`
   - `SHOPIFY_API_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_ADS_DEVELOPER_TOKEN`

5. **LLM**:
   - `LLM_API_KEY`
   - `LLM_BASE_URL=https://api.openai.com/v1`
   - `LLM_MODEL=gpt-4o-mini`

6. **Defaults**:
   - `TZ=Africa/Johannesburg`
   - `DEFAULT_CURRENCY=ZAR`

## Step 4: Deploy to Vercel

### Via Dashboard:
1. After adding all environment variables
2. Go to **Deployments** tab
3. Click **"Redeploy"** on the latest deployment
4. Or push a new commit to trigger auto-deployment

### Via CLI:
```bash
# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

## Step 5: Get Your Deployment URL

After deployment, Vercel will give you a URL like:
```
https://cag-digital-marketing-manager.vercel.app
```

**Save this URL** - you'll need it for OAuth redirect URLs!

## Step 6: Run Database Migrations

After first deployment, run migrations:

```bash
# Get your DIRECT_URL from Vercel
vercel env pull .env.local

# Run migrations
node scripts/run-migration.js "$(grep DIRECT_URL .env.local | cut -d '=' -f2)"
```

Or manually:
```bash
DATABASE_URL="your-direct-url-here" npm run migrate:deploy
```

## Step 7: Update OAuth Redirect URLs

Update each OAuth provider with your Vercel URL:

**Meta:**
- https://developers.facebook.com/apps → Your App → Settings → Basic
- Add: `https://your-project.vercel.app/api/integrations/meta/callback`

**Shopify:**
- https://partners.shopify.com → Your App → App setup
- Add: `https://your-project.vercel.app/api/integrations/shopify/callback`

**Google Ads:**
- https://console.cloud.google.com → APIs & Services → Credentials
- Add: `https://your-project.vercel.app/api/integrations/google/callback`

## Step 8: Set Up Cron Jobs

### If you have Vercel Pro:

1. Go to **Settings** → **Cron Jobs**
2. Add three jobs:
   - Path: `/api/cron/meta`, Schedule: `0 0 * * *`
   - Path: `/api/cron/shopify`, Schedule: `30 0 * * *`
   - Path: `/api/cron/google`, Schedule: `0 1 * * *`
3. For each, add header: `Authorization: Bearer ${CRON_SECRET}`

### If you're on free tier:

Use external cron service (see SETUP_GUIDE.md for details)

## Quick Commands Reference

```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Add environment variable
vercel env add VARIABLE_NAME

# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# Deploy
vercel --prod

# View logs
vercel logs
```

## Troubleshooting

**Build fails?**
- Check all environment variables are set
- Look at build logs in Vercel dashboard
- Verify Node.js version (should be 18+)

**Can't link project?**
- Make sure you're logged in: `vercel whoami`
- Check you have access to the GitHub repository

**Environment variables not working?**
- Make sure they're set for the correct environment (Production/Preview/Development)
- Redeploy after adding variables

## Next Steps

After deployment:
1. ✅ Test sign-up/sign-in
2. ✅ Create a workspace
3. ✅ Configure business profile
4. ✅ Connect integrations
5. ✅ Generate a test recommendation

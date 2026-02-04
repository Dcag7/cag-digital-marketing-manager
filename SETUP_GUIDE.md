# Step-by-Step Setup Guide

This guide walks you through setting up Growth OS from scratch.

## Part 1: Get Your Database URLs from Neon

### What are Database URLs?

Neon provides **two types of connection strings**:

1. **Pooled Connection** (`DATABASE_URL`) - For your application runtime
   - Uses connection pooling (pgbouncer) for better performance
   - Format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?pgbouncer=true&connect_timeout=15`
   - Use this for: Your Next.js app running on Vercel

2. **Direct Connection** (`DIRECT_URL`) - For migrations only
   - Direct connection without pooling
   - Format: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?connect_timeout=15`
   - Use this for: Running Prisma migrations

### Steps to Get URLs:

1. **Go to Neon Dashboard**: https://console.neon.tech
2. **Select your project** (or create one if you don't have it)
3. **Click on "Connection Details"** or look for "Connection string"
4. **You'll see two options**:
   - "Pooled connection" - Copy this for `DATABASE_URL`
   - "Direct connection" - Copy this for `DIRECT_URL`
5. **Copy both URLs** - You'll need them in the next step

**Example of what they look like:**
```
Pooled: postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
Direct: postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## Part 2: Configure Environment Variables in Vercel

### Step-by-Step:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (or import it from GitHub first)
3. **Go to Settings** → **Environment Variables**
4. **Add each variable** by clicking "Add New" and filling in:

#### Required Variables (Copy these exactly):

**Database URLs** (from Part 1):
```
Name: DATABASE_URL
Value: [Your pooled connection string from Neon]
Environment: Production, Preview, Development (select all)

Name: DIRECT_URL  
Value: [Your direct connection string from Neon]
Environment: Production, Preview, Development (select all)
```

**Clerk Authentication** (get from https://dashboard.clerk.com):
```
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_live_... (or pk_test_... for testing)
Environment: Production, Preview, Development

Name: CLERK_SECRET_KEY
Value: sk_live_... (or sk_test_... for testing)
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_CLERK_SIGN_IN_URL
Value: /sign-in
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_CLERK_SIGN_UP_URL
Value: /sign-up
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
Value: /app
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
Value: /app
Environment: Production, Preview, Development
```

**Encryption Key** (generate with the command below):
```
Name: ENCRYPTION_KEY
Value: [Run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"]
Environment: Production, Preview, Development
```

**Cron Secret** (generate with the command below):
```
Name: CRON_SECRET
Value: [Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
Environment: Production, Preview, Development
```

**Meta Marketing API** (from https://developers.facebook.com):
```
Name: META_APP_ID
Value: your_meta_app_id
Environment: Production, Preview, Development

Name: META_APP_SECRET
Value: your_meta_app_secret
Environment: Production, Preview, Development
```

**Shopify** (from https://partners.shopify.com):
```
Name: SHOPIFY_API_KEY
Value: your_shopify_api_key
Environment: Production, Preview, Development

Name: SHOPIFY_API_SECRET
Value: your_shopify_api_secret
Environment: Production, Preview, Development
```

**Google Ads** (from Google Cloud Console):
```
Name: GOOGLE_CLIENT_ID
Value: your_google_client_id
Environment: Production, Preview, Development

Name: GOOGLE_CLIENT_SECRET
Value: your_google_client_secret
Environment: Production, Preview, Development

Name: GOOGLE_ADS_DEVELOPER_TOKEN
Value: your_developer_token
Environment: Production, Preview, Development
```

**LLM Configuration** (OpenAI or compatible):
```
Name: LLM_API_KEY
Value: your_openai_api_key
Environment: Production, Preview, Development

Name: LLM_BASE_URL
Value: https://api.openai.com/v1
Environment: Production, Preview, Development

Name: LLM_MODEL
Value: gpt-4o-mini
Environment: Production, Preview, Development
```

**Timezone & Currency**:
```
Name: TZ
Value: Africa/Johannesburg
Environment: Production, Preview, Development

Name: DEFAULT_CURRENCY
Value: ZAR
Environment: Production, Preview, Development
```

5. **Click "Save"** after adding each variable
6. **Redeploy your project** after adding all variables (Vercel → Deployments → ... → Redeploy)

---

## Part 3: Run Database Migrations

After your first deployment, you need to run migrations to create all the database tables.

### Option A: Run Locally (Recommended)

1. **Get your DIRECT_URL** from Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Find `DIRECT_URL` and copy its value

2. **Run migration locally**:
   ```bash
   # Set the DIRECT_URL temporarily
   $env:DATABASE_URL="<paste-your-direct-url-here>"
   npm run db:migrate
   ```

   Or on Windows PowerShell:
   ```powershell
   $env:DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?connect_timeout=15"
   npm run db:migrate
   ```

3. **Verify** by checking Neon dashboard - you should see tables created

### Option B: Use Vercel CLI

```bash
# Install Vercel CLI if not already
npm i -g vercel

# Login
vercel login

# Pull environment variables
vercel env pull .env.local

# Run migration (uses DIRECT_URL from .env.local)
npm run db:migrate
```

---

## Part 4: Update OAuth Redirect URLs

After deploying to Vercel, you'll get a URL like: `https://your-project.vercel.app`

You need to add this URL to each OAuth provider:

### Meta (Facebook) Marketing API

1. Go to https://developers.facebook.com/apps
2. Select your app
3. Go to **Settings** → **Basic**
4. Scroll to **"Valid OAuth Redirect URIs"**
5. Add:
   ```
   https://your-project.vercel.app/api/integrations/meta/callback
   ```
6. Click **Save Changes**

### Shopify

1. Go to https://partners.shopify.com
2. Select your app
3. Go to **App setup** → **App URL**
4. Under **"Allowed redirection URL(s)"**, add:
   ```
   https://your-project.vercel.app/api/integrations/shopify/callback
   ```
5. Click **Save**

### Google Ads

1. Go to https://console.cloud.google.com
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your **OAuth 2.0 Client ID**
4. Under **"Authorized redirect URIs"**, click **Add URI**
5. Add:
   ```
   https://your-project.vercel.app/api/integrations/google/callback
   ```
6. Click **Save**

---

## Part 5: Set Up Cron Jobs in Vercel

### Option A: Via Vercel Dashboard (Pro Plan Required)

1. Go to Vercel Dashboard → Your Project → **Settings** → **Cron Jobs**
2. Click **"Add Cron Job"**
3. Add three cron jobs:

**Job 1: Meta Sync**
- **Path**: `/api/cron/meta`
- **Schedule**: `0 0 * * *` (runs daily at midnight UTC)
- **Headers**: 
  - Key: `Authorization`
  - Value: `Bearer ${CRON_SECRET}` (Vercel will auto-replace the variable)

**Job 2: Shopify Sync**
- **Path**: `/api/cron/shopify`
- **Schedule**: `30 0 * * *` (runs daily at 12:30 AM UTC)
- **Headers**: 
  - Key: `Authorization`
  - Value: `Bearer ${CRON_SECRET}`

**Job 3: Google Ads Sync**
- **Path**: `/api/cron/google`
- **Schedule**: `0 1 * * *` (runs daily at 1:00 AM UTC)
- **Headers**: 
  - Key: `Authorization`
  - Value: `Bearer ${CRON_SECRET}`

### Option B: Using vercel.json (Already Created)

The `vercel.json` file is already configured. However, Vercel cron jobs require a **Pro plan** ($20/month).

### Option C: Free Alternative - External Cron Service

If you're on the free tier, use an external service:

1. **Sign up for a free cron service** like:
   - https://cron-job.org (free tier available)
   - https://www.easycron.com
   - https://crontab.guru (just for testing schedules)

2. **Create three cron jobs** that call your endpoints:

**Meta Sync Job:**
- **URL**: `https://your-project.vercel.app/api/cron/meta`
- **Method**: GET
- **Headers**: `Authorization: Bearer <your-cron-secret>`
- **Schedule**: Daily at 0:00 UTC

**Shopify Sync Job:**
- **URL**: `https://your-project.vercel.app/api/cron/shopify`
- **Method**: GET
- **Headers**: `Authorization: Bearer <your-cron-secret>`
- **Schedule**: Daily at 0:30 UTC

**Google Ads Sync Job:**
- **URL**: `https://your-project.vercel.app/api/cron/google`
- **Method**: GET
- **Headers**: `Authorization: Bearer <your-cron-secret>`
- **Schedule**: Daily at 1:00 UTC

---

## Quick Checklist

- [ ] Got DATABASE_URL (pooled) from Neon
- [ ] Got DIRECT_URL (direct) from Neon
- [ ] Added all environment variables to Vercel
- [ ] Generated ENCRYPTION_KEY
- [ ] Generated CRON_SECRET
- [ ] Redeployed Vercel project after adding env vars
- [ ] Ran database migrations
- [ ] Updated Meta OAuth redirect URL
- [ ] Updated Shopify OAuth redirect URL
- [ ] Updated Google Ads OAuth redirect URL
- [ ] Set up cron jobs (Vercel Pro or external service)

---

## Need Help?

If you get stuck:
1. Check Vercel deployment logs for errors
2. Verify all environment variables are set correctly
3. Make sure database URLs are correct (pooled vs direct)
4. Check that OAuth redirect URLs match exactly (including https://)

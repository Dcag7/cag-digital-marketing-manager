# Quick Vercel Connection Guide

## ✅ Step 1: Complete Vercel Login

The login process has started. Please:

1. **Open the browser** that appeared (or go to the URL shown)
2. **Authorize** the Vercel CLI
3. **Come back here** when done

## ✅ Step 2: Link Your Project

After logging in, run:

```bash
vercel link
```

**When prompted:**
- Set up and deploy? → **No** (we'll add env vars first)
- Which scope? → Select your account
- Link to existing project? → **No**
- Project name? → `cag-digital-marketing-manager`
- Directory? → `./`

## ✅ Step 3: Add Environment Variables

You have two options:

### Option A: Via Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Find your project: **cag-digital-marketing-manager**
3. Click **Settings** → **Environment Variables**
4. Add all variables from the list below

### Option B: Via CLI

```bash
# Generate secrets first
npm run secrets:generate

# Then add each variable
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add ENCRYPTION_KEY
vercel env add CRON_SECRET
# ... continue for all variables
```

## 📋 Required Environment Variables

**First, generate your secrets:**
```bash
npm run secrets:generate
```

**Then add these (get values from respective dashboards):**

### Database (from Neon)
- `DATABASE_URL` - Pooled connection
- `DIRECT_URL` - Direct connection

### Clerk (from https://dashboard.clerk.com)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app`

### Secrets (from `npm run secrets:generate`)
- `ENCRYPTION_KEY`
- `CRON_SECRET`

### Integrations
- `META_APP_ID` & `META_APP_SECRET`
- `SHOPIFY_API_KEY` & `SHOPIFY_API_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`

### LLM
- `LLM_API_KEY`
- `LLM_BASE_URL=https://api.openai.com/v1`
- `LLM_MODEL=gpt-4o-mini`

### Defaults
- `TZ=Africa/Johannesburg`
- `DEFAULT_CURRENCY=ZAR`

**Important:** Select **Production**, **Preview**, and **Development** for each variable!

## ✅ Step 4: Deploy

After adding all environment variables:

```bash
vercel --prod
```

Or deploy via Dashboard → Deployments → Redeploy

## ✅ Step 5: Get Your URL & Update OAuth

After deployment, you'll get a URL like:
```
https://cag-digital-marketing-manager.vercel.app
```

Update OAuth redirect URLs:
- **Meta**: `https://your-url.vercel.app/api/integrations/meta/callback`
- **Shopify**: `https://your-url.vercel.app/api/integrations/shopify/callback`
- **Google**: `https://your-url.vercel.app/api/integrations/google/callback`

## ✅ Step 6: Run Migrations

```bash
# Pull env vars
vercel env pull .env.local

# Run migrations
node scripts/run-migration.js "$(grep DIRECT_URL .env.local | cut -d '=' -f2)"
```

## 🎉 Done!

Your app should now be live! Visit your Vercel URL to test it.

---

**Need help?** See `VERCEL_SETUP.md` for detailed instructions.

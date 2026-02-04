# Deployment Guide

This guide covers deploying Growth OS to Vercel with Neon Postgres.

## Prerequisites

- GitHub account (or GitLab/Bitbucket)
- Vercel account (free tier works)
- Neon account (free tier works)
- Clerk account (free tier works)
- Meta/Shopify/Google OAuth apps configured

## Step 1: Push Code to Git Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: Growth OS platform"

# Create a repository on GitHub and push
git remote add origin https://github.com/yourusername/cag-digital-marketing-manager.git
git branch -M main
git push -u origin main
```

## Step 2: Set Up Neon Database

1. Go to https://neon.tech and create an account
2. Create a new project
3. Copy both connection strings:
   - **Pooled connection** (for `DATABASE_URL`) - includes `?pgbouncer=true`
   - **Direct connection** (for `DIRECT_URL`) - no pgbouncer

Example:
```
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?connect_timeout=15"
```

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

## Step 4: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

### Database
```
DATABASE_URL=postgresql://...?pgbouncer=true&connect_timeout=15
DIRECT_URL=postgresql://...?connect_timeout=15
```

### Clerk Authentication
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
```

### Encryption
```
ENCRYPTION_KEY=<your-32-byte-base64-key>
```
Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### Cron Protection
```
CRON_SECRET=<random-secret-string>
```
Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Meta Marketing API
```
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
```

### Shopify
```
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
```

### Google Ads
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
```

### LLM Configuration
```
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

### Timezone & Currency
```
TZ=Africa/Johannesburg
DEFAULT_CURRENCY=ZAR
```

**Important**: Set these for all environments (Production, Preview, Development) or at least Production.

## Step 5: Run Database Migrations

After first deployment, run migrations:

```bash
# Option 1: Via Vercel CLI
vercel env pull .env.local
npm run db:migrate

# Option 2: Via Vercel Dashboard
# Go to your project → Settings → Environment Variables
# Copy DIRECT_URL, then run locally:
DATABASE_URL=<your-direct-url> npm run db:migrate
```

Or use Vercel's built-in database migration feature if available.

## Step 6: Configure OAuth Redirect URLs

### Meta Marketing API
1. Go to https://developers.facebook.com/apps
2. Select your app → Settings → Basic
3. Add to "Valid OAuth Redirect URIs":
   ```
   https://yourdomain.vercel.app/api/integrations/meta/callback
   ```

### Shopify
1. Go to https://partners.shopify.com
2. Select your app → App setup
3. Add to "Allowed redirection URL(s)":
   ```
   https://yourdomain.vercel.app/api/integrations/shopify/callback
   ```

### Google Ads
1. Go to https://console.cloud.google.com
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client
4. Add to "Authorized redirect URIs":
   ```
   https://yourdomain.vercel.app/api/integrations/google/callback
   ```

## Step 7: Set Up Vercel Cron Jobs

1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. Add three cron jobs:

**Meta Sync** (Daily at 2 AM SAST / 0:00 UTC)
- Path: `/api/cron/meta`
- Schedule: `0 0 * * *` (UTC)
- Headers:
  - `Authorization: Bearer ${CRON_SECRET}`

**Shopify Sync** (Daily at 2:30 AM SAST / 0:30 UTC)
- Path: `/api/cron/shopify`
- Schedule: `30 0 * * *` (UTC)
- Headers:
  - `Authorization: Bearer ${CRON_SECRET}`

**Google Ads Sync** (Daily at 3 AM SAST / 1:00 UTC)
- Path: `/api/cron/google`
- Schedule: `0 1 * * *` (UTC)
- Headers:
  - `Authorization: Bearer ${CRON_SECRET}`

Alternatively, create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/meta",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/shopify",
      "schedule": "30 0 * * *"
    },
    {
      "path": "/api/cron/google",
      "schedule": "0 1 * * *"
    }
  ]
}
```

Note: Vercel cron jobs require Pro plan. For free tier, use external cron service (e.g., cron-job.org) that calls your endpoints with the Authorization header.

## Step 8: Verify Deployment

1. Visit your Vercel deployment URL
2. Sign up/Sign in with Clerk
3. Create your first workspace
4. Configure business profile in Settings
5. Connect integrations
6. Generate a test recommendation

## Step 9: Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update OAuth redirect URLs with your custom domain

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` uses pooled connection with `pgbouncer=true`
- Verify `DIRECT_URL` uses direct connection (no pgbouncer)
- Check Neon project is active and not paused

### Migration Errors
- Ensure `DIRECT_URL` is set correctly
- Run migrations locally first: `DATABASE_URL=<direct-url> npm run db:migrate`
- Check Prisma schema matches database state

### Cron Jobs Not Running
- Verify `CRON_SECRET` is set in environment variables
- Check cron job configuration in Vercel dashboard
- Verify Authorization header matches: `Bearer ${CRON_SECRET}`
- Check Vercel function logs for errors

### OAuth Callbacks Failing
- Verify redirect URLs match exactly (including https://)
- Check OAuth app credentials are correct
- Verify environment variables are set in Vercel

### Build Errors
- Check Node.js version (should be 18+)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] All environment variables set
- [ ] OAuth redirect URLs configured
- [ ] Cron jobs configured
- [ ] Test sign-up/sign-in flow
- [ ] Create test workspace
- [ ] Configure business profile
- [ ] Test integration connections
- [ ] Generate test recommendation
- [ ] Verify audit logs are working

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Function Logs**: Vercel Dashboard → Your Project → Functions
- **Database**: Neon Dashboard for query performance
- **Error Tracking**: Consider adding Sentry for production

## Security Reminders

- Never commit `.env.local` or `.env` files
- Rotate `ENCRYPTION_KEY` and `CRON_SECRET` periodically
- Use production Clerk keys (not test keys)
- Enable Vercel's DDoS protection
- Review audit logs regularly

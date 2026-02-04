# Vercel Setup via Dashboard (Easiest Method)

This method doesn't require CLI authentication - everything is done through the web interface.

## Step 1: Import Project to Vercel

1. **Go to**: https://vercel.com/dashboard
2. **Click**: "Add New Project" (top right)
3. **Click**: "Import Git Repository"
4. **Find**: `Dcag7/cag-digital-marketing-manager` in the list
5. **Click**: "Import"

## Step 2: Configure Project

Vercel will auto-detect Next.js. Just verify these settings:

- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

**Important**: **DON'T click "Deploy" yet!** We need to add environment variables first.

## Step 3: Add Environment Variables

Before deploying, add all environment variables:

1. **Click**: "Environment Variables" (in the project configuration)
2. **Add each variable** one by one:

### Quick Reference - Copy These Names:

```
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
ENCRYPTION_KEY
CRON_SECRET
META_APP_ID
META_APP_SECRET
SHOPIFY_API_KEY
SHOPIFY_API_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_ADS_DEVELOPER_TOKEN
LLM_API_KEY
LLM_BASE_URL
LLM_MODEL
TZ
DEFAULT_CURRENCY
```

### For Each Variable:

1. **Name**: Enter the variable name (e.g., `DATABASE_URL`)
2. **Value**: Enter the value
3. **Environments**: Select all three:
   - ☑ Production
   - ☑ Preview  
   - ☑ Development
4. **Click**: "Add"
5. **Repeat** for all variables

### Generate Secrets First:

Before adding `ENCRYPTION_KEY` and `CRON_SECRET`, generate them:

```bash
npm run secrets:generate
```

This will output the values you need to copy.

## Step 4: Deploy

After adding all environment variables:

1. **Scroll down** and click **"Deploy"**
2. Wait for the build to complete (2-3 minutes)
3. **Copy your deployment URL** (e.g., `https://cag-digital-marketing-manager.vercel.app`)

## Step 5: Run Database Migrations

After first deployment:

1. **Get your DIRECT_URL**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Find `DIRECT_URL` and copy its value

2. **Run migration locally**:
   ```bash
   # On Windows PowerShell:
   $env:DATABASE_URL="<paste-your-direct-url-here>"
   npm run migrate:deploy
   ```

   Or use the helper script:
   ```bash
   node scripts/run-migration.js "<paste-direct-url-here>"
   ```

## Step 6: Update OAuth Redirect URLs

Update each OAuth provider with your Vercel URL:

**Your Vercel URL will be**: `https://cag-digital-marketing-manager.vercel.app` (or similar)

### Meta (Facebook):
- Go to: https://developers.facebook.com/apps
- Your App → Settings → Basic
- "Valid OAuth Redirect URIs" → Add:
  ```
  https://your-project.vercel.app/api/integrations/meta/callback
  ```

### Shopify:
- Go to: https://partners.shopify.com
- Your App → App setup
- "Allowed redirection URL(s)" → Add:
  ```
  https://your-project.vercel.app/api/integrations/shopify/callback
  ```

### Google Ads:
- Go to: https://console.cloud.google.com
- APIs & Services → Credentials → OAuth 2.0 Client
- "Authorized redirect URIs" → Add:
  ```
  https://your-project.vercel.app/api/integrations/google/callback
  ```

## Step 7: Set Up Cron Jobs (Optional)

### If you have Vercel Pro:

1. Go to: Settings → Cron Jobs
2. Add three jobs:
   - **Meta**: Path `/api/cron/meta`, Schedule `0 0 * * *`
   - **Shopify**: Path `/api/cron/shopify`, Schedule `30 0 * * *`
   - **Google**: Path `/api/cron/google`, Schedule `0 1 * * *`
3. For each, add header: `Authorization: Bearer ${CRON_SECRET}`

### If you're on free tier:

Use external cron service (see SETUP_GUIDE.md)

## ✅ Done!

Your app should now be live! Visit your Vercel URL to test.

---

## Troubleshooting

**Build fails?**
- Check all environment variables are added
- Look at build logs in Vercel dashboard
- Make sure you selected all environments (Production/Preview/Development)

**Can't find the project?**
- Make sure you've imported from GitHub
- Check you're logged into the correct Vercel account

**Need to add more variables later?**
- Go to: Settings → Environment Variables
- Add new variable
- Redeploy: Deployments → ... → Redeploy

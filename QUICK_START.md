# Quick Start - Deployment Checklist

## 🔑 Generated Secrets (Save These!)

```
ENCRYPTION_KEY=f7DgphKMWeqXsQ9FlN14QsueVHDauUssmsLxQB5uwL0=
CRON_SECRET=416c73f9d8c2a8d0b3513a9082218197f4f957fc6667b7cc5ec962507442cad9
```

**Copy these to Vercel environment variables!**

---

## 📋 Step-by-Step Checklist

### 1. Get Database URLs from Neon
- [ ] Go to https://console.neon.tech
- [ ] Select your project
- [ ] Copy **Pooled connection** → This is your `DATABASE_URL`
- [ ] Copy **Direct connection** → This is your `DIRECT_URL`

### 2. Add Environment Variables to Vercel
- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Add `DATABASE_URL` (pooled connection)
- [ ] Add `DIRECT_URL` (direct connection)
- [ ] Add `ENCRYPTION_KEY` (see above)
- [ ] Add `CRON_SECRET` (see above)
- [ ] Add all other variables from `.env.example`
- [ ] **Redeploy** after adding variables

### 3. Run Database Migrations
```bash
# Option 1: Using the helper script
node scripts/run-migration.js "your-direct-url-here"

# Option 2: Direct command
DATABASE_URL="your-direct-url" npm run migrate:deploy
```

### 4. Update OAuth Redirect URLs

After deployment, your Vercel URL will be: `https://your-project.vercel.app`

**Meta:**
- Go to https://developers.facebook.com/apps
- Settings → Basic → Valid OAuth Redirect URIs
- Add: `https://your-project.vercel.app/api/integrations/meta/callback`

**Shopify:**
- Go to https://partners.shopify.com
- App setup → Allowed redirection URL(s)
- Add: `https://your-project.vercel.app/api/integrations/shopify/callback`

**Google Ads:**
- Go to https://console.cloud.google.com
- APIs & Services → Credentials → OAuth 2.0 Client
- Authorized redirect URIs
- Add: `https://your-project.vercel.app/api/integrations/google/callback`

### 5. Set Up Cron Jobs

**If you have Vercel Pro:**
- Go to Settings → Cron Jobs
- Add three jobs (see SETUP_GUIDE.md for details)

**If you're on free tier:**
- Use external service like cron-job.org
- Call your endpoints with: `Authorization: Bearer <your-cron-secret>`

---

## 🆘 Quick Troubleshooting

**Migration fails?**
- Make sure you're using `DIRECT_URL` (not pooled)
- Check Neon dashboard - is database active?

**Build fails on Vercel?**
- Check all environment variables are set
- Look at build logs in Vercel dashboard

**OAuth not working?**
- Verify redirect URLs match exactly (including https://)
- Check environment variables are correct

---

## 📚 Full Documentation

- **Detailed Setup**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Generate new secrets**: `npm run secrets:generate`

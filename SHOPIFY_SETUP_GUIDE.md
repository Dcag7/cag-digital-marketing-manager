# Shopify API Setup - Complete Guide

## Quick Start: Using Existing App in Dev Dashboard

If you already have an app in the Shopify Partners dev dashboard (like "CSW Growth OS"), you can use that! Here's how to get your credentials.

## Step 1: Access Your App

1. Go to https://partners.shopify.com
2. Sign in to your Partner account
3. You should see your app in the left sidebar (e.g., "CSW Growth OS")
4. Click on your app name to expand it

## Step 2: Get Your API Credentials

1. Click **"Settings"** in the sidebar (under your app name)
2. You'll see the **"Credentials"** section at the top of the page

### What You'll See:

**Client ID:**
- This is visible and not hidden
- Example: `b7fe3381efe563b92410ddd8005901c7`
- **This is your `SHOPIFY_API_KEY`**
- Click the **copy icon** to copy it

**Secret:**
- This is hidden by default (shows dots: `...............................`)
- Click the **eye icon** (👁️) to reveal it
- Or click **"Show"** button if available
- **This is your `SHOPIFY_API_SECRET`**
- Click the **copy icon** to copy it
- **Important:** Copy it immediately - it may hide again

## Step 3: Verify App Scopes

1. Click **"Versions"** in the sidebar
2. Click on your active version (should have a green "Active" tag)
3. Look at the **"Scopes"** field
4. Make sure you have at least:
   - `read_orders` - To read order data
   - `read_products` - To read product data
   - `read_customers` (optional) - To read customer data

**If you need to add scopes:**
- You'll need to create a new version
- Click **"New version"** button
- Add the required scopes
- Release the new version

## Step 4: Set Redirect URL (After Deployment)

**Important:** Do this AFTER you have your Vercel deployment URL.

1. Go to **"Settings"** in your app
2. Look for **"App setup"** or **"Configuration"** section
3. Find **"Allowed redirection URL(s)"** or **"Redirect URLs"**
4. Click **"Add URL"** or the **"+"** button
5. Enter:
   ```
   https://your-project.vercel.app/api/integrations/shopify/callback
   ```
   Replace `your-project.vercel.app` with your actual Vercel domain
6. Click **"Save"**

## Step 5: Add to Environment Variables

Add these to your Vercel environment variables:

```
SHOPIFY_API_KEY=your_client_id_here
SHOPIFY_API_SECRET=your_secret_here
```

## Creating a New App (If Needed)

If you don't have an app yet:

1. In the dev dashboard, click **"Apps"** in the top navigation
2. Click **"Create app"** button
3. Choose **"Custom app"**
4. Fill in:
   - **App name**: "Growth OS" (or your preferred name)
   - **App URL**: Leave blank for now, or use your Vercel URL
5. Click **"Create app"**
6. Follow Steps 2-5 above

## Troubleshooting

**Can't see the Secret?**
- Click the eye icon (👁️) next to the Secret field
- If that doesn't work, try clicking "Show" or "Reveal"
- Make sure you have permission to view secrets

**Need to rotate the secret?**
- Click **"Rotate"** button next to the Secret
- This will generate a new secret
- Update your environment variables with the new secret

**App not showing in sidebar?**
- Make sure you're logged into the correct Partner account
- Check that the app wasn't deleted or archived
- Try refreshing the page

**Scopes missing?**
- Go to Versions → Your active version
- Check the Scopes field
- If needed, create a new version with the required scopes

## What Each Credential Does

- **Client ID (SHOPIFY_API_KEY)**: Used to identify your app during OAuth flow
- **Secret (SHOPIFY_API_SECRET)**: Used to securely authenticate your app during OAuth

Both are required for the OAuth connection flow in Growth OS.

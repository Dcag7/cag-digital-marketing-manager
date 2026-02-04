# Meta Marketing API Setup - Complete Step-by-Step Guide

## Overview

This guide walks you through setting up Meta (Facebook) Marketing API access for Growth OS.

## Step 1: Go to Meta Developers

1. Visit https://developers.facebook.com
2. Sign in with your Facebook account
3. If you don't have a developer account, you'll be prompted to create one

## Step 2: Create a New App

1. Click **"My Apps"** in the top navigation
2. Click **"Create App"** button
3. Select **"Business"** as the app type
4. Fill in the app details:
   - **App Name**: "Growth OS" (or your preferred name)
   - **App Contact Email**: Your email address
5. Click **"Create App"**

## Step 3: Select Use Cases

After creating the app, you'll be taken to the **"Add use cases"** page.

### What You'll See:

- A list of use cases with checkboxes
- Filter options on the left (Featured, All, Ads and monetization, etc.)

### What to Select:

**✅ REQUIRED:** Check the box for:
- **"Create & manage ads with Marketing API"**
  - This is usually the first option in the "Featured" section
  - Icon: Monitor screen with a square
  - Description: "Create, manage and optimize ad campaigns across Meta technologies. Programmatically extend, stop or update ad campaigns and more."

**Optional:** You can also select:
- "Authenticate and request data from users with Facebook Login" (if you want Facebook login)
- Other use cases as needed

### How to Select:

1. Find **"Create & manage ads with Marketing API"** in the list
2. Check the checkbox on the right side of that use case card
3. Click **"Next"** button at the bottom right

## Step 4: Complete App Setup Wizard

After selecting use cases, you'll go through additional setup steps:

1. **Business Information** (if prompted)
   - Fill in your business details
   - Click "Next"

2. **Requirements** (if shown)
   - Review any requirements
   - Click "Next"

3. **Overview**
   - Review your app configuration
   - Click "Complete" or "Finish"

## Step 5: Get Your App ID and Secret

1. After completing the setup, you'll be in your app dashboard
2. In the left sidebar, click **"Settings"** → **"Basic"**
3. You'll see:
   - **App ID** - A long number (e.g., `1234567890123456`)
     - **This is your `META_APP_ID`**
     - Copy this value
   - **App Secret** - Hidden by default
     - Click **"Show"** button to reveal it
     - **This is your `META_APP_SECRET`**
     - Copy this value immediately (you won't be able to see it again easily)

## Step 6: Add Marketing API Product (If Not Already Added)

If the Marketing API wasn't automatically added:

1. In your app dashboard, look for **"Add Products to Your App"** section
2. Find **"Marketing API"** in the list
3. Click **"Set Up"** next to it
4. Follow any additional setup prompts

## Step 7: Configure OAuth Redirect (After Deployment)

**Important:** Do this step AFTER you have your Vercel deployment URL.

1. Still in **Settings** → **Basic**
2. Scroll down to **"Valid OAuth Redirect URIs"** section
3. Click **"Add URI"** or the **"+"** button
4. Enter your Vercel URL:
   ```
   https://your-project.vercel.app/api/integrations/meta/callback
   ```
   Replace `your-project.vercel.app` with your actual Vercel domain
5. Click **"Save Changes"**

## Step 8: Add to Environment Variables

Add these to your Vercel environment variables:

```
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
```

## Troubleshooting

**Can't find "Create & manage ads with Marketing API"?**
- Make sure you selected "Business" as app type
- Look in the "Featured" or "Ads and monetization" filter
- It should be the first option in the Featured list

**Marketing API not showing up?**
- Make sure you selected the use case during setup
- Go to "Add Products" and manually add Marketing API

**App Secret not showing?**
- Click the "Show" button next to App Secret
- If you can't see it, you may need to verify your account or add additional permissions

**OAuth redirect not working?**
- Make sure the URL matches exactly (including `https://`)
- The path must be: `/api/integrations/meta/callback`
- Wait a few minutes after saving for changes to propagate

## Next Steps

After setting up Meta:
1. Add `META_APP_ID` and `META_APP_SECRET` to Vercel environment variables
2. Deploy your app to Vercel
3. Come back and add the OAuth redirect URL
4. Test the integration in your app

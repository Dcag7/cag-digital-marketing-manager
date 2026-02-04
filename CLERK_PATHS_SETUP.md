# Clerk Component Paths Setup Guide

## Understanding Clerk's Component Paths

When setting up Clerk, you need to configure where users go for sign-in and sign-up. Clerk gives you two options:

1. **Account Portal** (Clerk's hosted pages) - Default
2. **Development host** (Your app's pages) - What we want

## Step-by-Step Setup

### Step 1: Navigate to Paths Settings

1. Go to https://dashboard.clerk.com
2. Select your application
3. Click **"Paths"** in the left sidebar
4. You'll see the "Component paths" section

### Step 2: Configure Sign-In

**What you'll see:**
- Two radio button options:
  - ☑ "Sign-in page on Account Portal" (selected by default)
  - ☐ "Sign-in page on development host" (what we want)

**What to do:**
1. Click the radio button for **"Sign-in page on development host"**
2. A text field will appear below
3. Enter: `/sign-in`
4. This tells Clerk to use your Next.js app's sign-in page at `/app/sign-in`

**Why:** Your app has custom sign-in pages at `/app/sign-in/[[...sign-in]]/page.tsx`, so you want to use those instead of Clerk's hosted pages.

### Step 3: Configure Sign-Up

**What you'll see:**
- Two radio button options:
  - ☑ "Sign-up page on Account Portal" (selected by default)
  - ☐ "Sign-up page on development host" (what we want)

**What to do:**
1. Click the radio button for **"Sign-up page on development host"**
2. A text field will appear below
3. Enter: `/sign-up`
4. This tells Clerk to use your Next.js app's sign-up page at `/app/sign-up`

### Step 4: Configure Application Paths (Optional)

In the "Paths" section, you'll see an "Application paths" subsection with:

**Home URL:**
- Leave this blank (your app's homepage is at the root `/`)
- Or if your homepage is at a different path, enter it here

**Unauthorized sign in URL:**
- Leave this blank (uses default)
- Or set to `/sign-in` if you want users redirected to sign-in when unauthorized

**Note:** The "After sign-in" and "After sign-up" redirects are NOT in the Clerk dashboard. They're configured via environment variables in Vercel:
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app`

These environment variables control where users go after successful authentication.

### Step 5: Sign-Out Configuration (Optional)

For "Signing Out":
- You can leave it as "Sign-in page on Account Portal" (default)
- Or select "Page on development host" and enter `/sign-in` if you want users redirected to your app's sign-in page after signing out

## Visual Guide

**Before (Default - Account Portal):**
```
☑ Sign-in page on Account Portal
  https://modern-sheepdog-64.accounts.dev/sign-in

☑ Sign-up page on Account Portal  
  https://modern-sheepdog-64.accounts.dev/sign-up
```

**After (Development Host - What we want):**
```
☐ Sign-in page on Account Portal
  https://modern-sheepdog-64.accounts.dev/sign-in

☑ Sign-in page on development host
  /sign-in  ← Enter this

☐ Sign-up page on Account Portal
  https://modern-sheepdog-64.accounts.dev/sign-up

☑ Sign-up page on development host
  /sign-up  ← Enter this
```

## Important Notes

1. **Don't delete the prefilled URLs** - They're just showing what the Account Portal option uses. You're selecting a different option.

2. **Use paths, not full URLs** - When you select "development host", you enter paths like `/sign-in`, not full URLs like `https://yourdomain.com/sign-in`

3. **These match your Next.js routes:**
   - `/sign-in` → Your app's `/app/sign-in/[[...sign-in]]/page.tsx`
   - `/sign-up` → Your app's `/app/sign-up/[[...sign-up]]/page.tsx`

4. **After deployment:** These paths will work with your Vercel domain automatically. Clerk knows your app's domain from the environment variables.

## Environment Variables

After configuring these paths, make sure your environment variables match:

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
```

These should match what you configured in Clerk's dashboard.

## Troubleshooting

**Can't find the "Paths" section?**
- Make sure you're in your application dashboard (not organization settings)
- Look in the left sidebar under "Configure"

**Paths not working after deployment?**
- Verify your environment variables are set correctly in Vercel
- Make sure you selected "development host" not "Account Portal"
- Check that your Next.js routes exist at `/app/sign-in` and `/app/sign-up`

**Users going to Clerk's hosted pages instead?**
- You probably have "Account Portal" selected instead of "development host"
- Go back and select "development host" for both sign-in and sign-up

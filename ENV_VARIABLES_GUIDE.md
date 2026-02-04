# Complete Guide: Where to Get Each Environment Variable

This guide shows you exactly where to get each environment variable and how to obtain it.

---

## 📊 Database URLs (from Neon)

### DATABASE_URL and DIRECT_URL

**Step 1:** Go to https://console.neon.tech

**Step 2:** Sign in or create an account

**Step 3:** Create a new project (or select existing one)
- Click "New Project"
- Choose a name (e.g., "growth-os")
- Select a region
- Click "Create Project"

**Step 4:** Get connection strings
- In the "Connect to your database" modal, you'll see a toggle switch for **"Connection pooling"**
- You need to get TWO connection strings by toggling this switch:

**Pooled Connection** (for `DATABASE_URL`):
1. Make sure **"Connection pooling"** toggle is **ON** (green/enabled)
2. The connection string will show a hostname with `-pooler` in it
3. Example: `postgresql://neondb_owner:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
4. Click **"Show password"** to reveal the full password
5. Click **"Copy snippet"** to copy the full connection string
6. **This is your `DATABASE_URL`**

**Direct Connection** (for `DIRECT_URL`):
1. Toggle **"Connection pooling"** to **OFF** (grey/disabled)
2. The connection string will show a hostname WITHOUT `-pooler` in it
3. Example: `postgresql://neondb_owner:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
4. Click **"Show password"** to reveal the full password
5. Click **"Copy snippet"** to copy the full connection string
6. **This is your `DIRECT_URL`**

**Key Differences:**
- **Pooled** (DATABASE_URL): Hostname contains `-pooler` (e.g., `ep-xxx-pooler.region.aws.neon.tech`)
- **Direct** (DIRECT_URL): Hostname does NOT contain `-pooler` (e.g., `ep-xxx.region.aws.neon.tech`)

**Note:** Both will have the same password. Make sure to copy the FULL connection string including the password.

---

## 🔐 Clerk Authentication

### NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY

**Step 1:** Go to https://dashboard.clerk.com

**Step 2:** Sign in or create an account

**Step 3:** Create a new application
- Click "Create Application"
- Choose a name (e.g., "Growth OS")
- Select authentication methods (Email, Google, etc.)
- Click "Create Application"

**Step 4:** Get your keys
- In your application dashboard, go to **"API Keys"** in the sidebar
- You'll see two keys:

**Publishable Key:**
- Starts with `pk_test_` (for development) or `pk_live_` (for production)
- **This is your `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`**
- Copy the entire key

**Secret Key:**
- Starts with `sk_test_` (for development) or `sk_live_` (for production)
- Click "Show" to reveal it
- **This is your `CLERK_SECRET_KEY`**
- Copy the entire key

**Step 5:** Configure Component Paths (Important!)

- Go to **"Paths"** in the sidebar (or look for "Component paths" section)
- You'll see three sections: `<SignIn />`, `<SignUp />`, and "Signing Out"

**For `<SignIn />`:**
1. Select the radio button: **"Sign-in page on development host"** (NOT "Account Portal")
2. In the text field that appears, enter: `/sign-in`
3. This tells Clerk to use your app's sign-in page, not Clerk's hosted page

**For `<SignUp />`:**
1. Select the radio button: **"Sign-up page on development host"** (NOT "Account Portal")
2. In the text field that appears, enter: `/sign-up`
3. This tells Clerk to use your app's sign-up page

**For "Signing Out":**
1. You can leave this as "Sign-in page on Account Portal" (default)
2. Or select "Page on development host" and enter `/sign-in` if you want users redirected to your app

**Important:** 
- The prefilled URLs like `https://modern-sheepdog-64.accounts.dev/sign-in` are Clerk's hosted pages
- You want to use YOUR app's pages instead, so select "development host" and use paths like `/sign-in` and `/sign-up`
- These paths match the routes in your Next.js app (`/app/sign-in` and `/app/sign-up`)

**Step 6:** Configure Application Paths (Optional)

In the "Paths" section, you'll see "Application paths" with:
- **Home URL**: Leave this blank (your app's homepage is at the root)
- **Unauthorized sign in URL**: Leave this blank or set to `/sign-in` if you want a custom unauthorized page

**Note:** The "After sign-in" and "After sign-up" redirects are configured via environment variables, not in the Clerk dashboard. Set these in Vercel:
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app`

These environment variables tell Clerk where to redirect users after authentication.

### Clerk URL Variables (Set these exact values):

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
```

---

## 🔑 Generated Secrets

### ENCRYPTION_KEY and CRON_SECRET

These are generated locally - you don't get them from anywhere.

**Step 1:** Open PowerShell in your project directory

**Step 2:** Run:
```powershell
node scripts/generate-secrets.js
```

**Step 3:** Copy the output:
- `ENCRYPTION_KEY=...` (copy everything after the `=`)
- `CRON_SECRET=...` (copy everything after the `=`)

**Note:** These are random values generated just for you. Keep them secret!

---

## 📱 Meta (Facebook) Marketing API

### META_APP_ID and META_APP_SECRET

**Step 1:** Go to https://developers.facebook.com

**Step 2:** Sign in with your Facebook account

**Step 3:** Create a new app
- Click "My Apps" → "Create App"
- Select "Business" as app type
- Fill in app details:
  - App Name: "Growth OS" (or your choice)
  - App Contact Email: Your email
- Click "Create App"

**Step 4:** Select Use Cases
- You'll be taken to the "Add use cases" page
- **IMPORTANT:** Check the box for **"Create & manage ads with Marketing API"**
  - This is the first option in the "Featured" section
  - Description: "Create, manage and optimize ad campaigns across Meta technologies..."
- You can also select other use cases if needed, but this one is required
- Click **"Next"** to continue

**Step 5:** Complete App Setup
- Follow the remaining setup steps:
  - Business information (if prompted)
  - Requirements review
  - Overview
- Complete the wizard

**Step 6:** Get your App ID and Secret
- Go to **Settings** → **Basic** in the left sidebar
- You'll see:
  - **App ID** - This is your `META_APP_ID`
  - **App Secret** - Click "Show" to reveal it - This is your `META_APP_SECRET`

**Step 7:** Set up OAuth redirect (after you have Vercel URL)
- Still in Settings → Basic
- Scroll to "Valid OAuth Redirect URIs"
- Add: `https://your-project.vercel.app/api/integrations/meta/callback`
- (Do this after deployment)

---

## 🛍️ Shopify

### SHOPIFY_API_KEY and SHOPIFY_API_SECRET

**Step 1:** Go to https://partners.shopify.com

**Step 2:** Sign in or create a Partner account (free)

**Step 3:** Create a new app
- Click "Apps" in sidebar
- Click "Create app"
- Choose "Custom app"
- Fill in:
  - App name: "Growth OS"
  - App URL: (leave blank for now, or use your Vercel URL)
- Click "Create app"

**Step 4:** Configure app scopes
- In your app, go to **"Configuration"**
- Under "Admin API integration scopes", select:
  - `read_orders`
  - `read_products`
  - `read_customers` (optional)
- Click "Save"

**Step 5:** Get API credentials
- Go to **"API credentials"** tab
- You'll see:
  - **API Key** - This is your `SHOPIFY_API_KEY`
  - **API Secret Key** - Click "Reveal" - This is your `SHOPIFY_API_SECRET`

**Step 6:** Set redirect URL (after you have Vercel URL)
- In "App setup" → "Allowed redirection URL(s)"
- Add: `https://your-project.vercel.app/api/integrations/shopify/callback`
- (Do this after deployment)

---

## 🔍 Google Ads

### GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_ADS_DEVELOPER_TOKEN

This requires multiple steps across different Google services.

#### Part 1: Google Cloud Console (for OAuth)

**Step 1:** Go to https://console.cloud.google.com

**Step 2:** Create a new project (or select existing)
- Click project dropdown → "New Project"
- Name: "Growth OS"
- Click "Create"

**Step 3:** Enable Google Ads API
- Go to **"APIs & Services"** → **"Library"**
- Search for "Google Ads API"
- Click on it and click "Enable"

**Step 4:** Create OAuth 2.0 credentials
- Go to **"APIs & Services"** → **"Credentials"**
- Click **"Create Credentials"** → **"OAuth client ID"**
- If prompted, configure OAuth consent screen first:
  - User Type: External
  - App name: "Growth OS"
  - User support email: Your email
  - Developer contact: Your email
  - Click "Save and Continue" through scopes
  - Add test users (your email)
  - Click "Save and Continue"
- Back to creating OAuth client:
  - Application type: **Web application**
  - Name: "Growth OS Web Client"
  - Authorized redirect URIs: `https://your-project.vercel.app/api/integrations/google/callback` (add after deployment)
  - Click "Create"
- You'll see:
  - **Client ID** - This is your `GOOGLE_CLIENT_ID`
  - **Client secret** - This is your `GOOGLE_CLIENT_SECRET`

#### Part 2: Google Ads API Center (for Developer Token)

**Step 1:** Go to https://ads.google.com

**Step 2:** Sign in with a Google Ads account (or create one)

**Step 3:** Go to API Center
- Click the tools icon (wrench) in top right
- Under "Setup", click **"API Center"**

**Step 4:** Apply for Developer Token
- Click "Apply for access"
- Fill in the form:
  - Application name: "Growth OS"
  - Contact email: Your email
  - Website: Your website or Vercel URL
  - Use case: Select "Other" and describe your use case
- Submit the application
- **Note:** This can take 24-48 hours for approval

**Step 5:** Once approved, get your Developer Token
- Go back to API Center
- You'll see your **Developer Token**
- **This is your `GOOGLE_ADS_DEVELOPER_TOKEN`**

**Important:** You need an active Google Ads account with at least one campaign to get approved.

---

## 🤖 LLM Configuration

### LLM_API_KEY, LLM_BASE_URL, and LLM_MODEL

#### Option 1: OpenAI (Recommended)

**Step 1:** Go to https://platform.openai.com

**Step 2:** Sign in or create an account

**Step 3:** Get API key
- Click your profile → **"API keys"**
- Click **"Create new secret key"**
- Name it (e.g., "Growth OS")
- Click "Create secret key"
- **Copy the key immediately** - This is your `LLM_API_KEY`
- (You won't be able to see it again)

**Step 4:** Set these values:
```
LLM_API_KEY=<your-openai-api-key>
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

#### Option 2: Other LLM Providers

If using a different provider (Anthropic, etc.):
- Get API key from their dashboard
- Set `LLM_BASE_URL` to their API endpoint
- Set `LLM_MODEL` to their model name

---

## 🌍 Timezone and Currency

### TZ and DEFAULT_CURRENCY

These are simple fixed values:

```
TZ=Africa/Johannesburg
DEFAULT_CURRENCY=ZAR
```

Just copy these exactly as shown above.

---

## 📋 Quick Checklist

Use this to track what you've obtained:

- [ ] **DATABASE_URL** - From Neon (pooled connection)
- [ ] **DIRECT_URL** - From Neon (direct connection)
- [ ] **NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY** - From Clerk dashboard
- [ ] **CLERK_SECRET_KEY** - From Clerk dashboard
- [ ] **NEXT_PUBLIC_CLERK_SIGN_IN_URL** - Set to `/sign-in`
- [ ] **NEXT_PUBLIC_CLERK_SIGN_UP_URL** - Set to `/sign-up`
- [ ] **NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL** - Set to `/app`
- [ ] **NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL** - Set to `/app`
- [ ] **ENCRYPTION_KEY** - Generated locally (`node scripts/generate-secrets.js`)
- [ ] **CRON_SECRET** - Generated locally (`node scripts/generate-secrets.js`)
- [ ] **META_APP_ID** - From Facebook Developers
- [ ] **META_APP_SECRET** - From Facebook Developers
- [ ] **SHOPIFY_API_KEY** - From Shopify Partners
- [ ] **SHOPIFY_API_SECRET** - From Shopify Partners
- [ ] **GOOGLE_CLIENT_ID** - From Google Cloud Console
- [ ] **GOOGLE_CLIENT_SECRET** - From Google Cloud Console
- [ ] **GOOGLE_ADS_DEVELOPER_TOKEN** - From Google Ads API Center (takes 24-48h)
- [ ] **LLM_API_KEY** - From OpenAI or your LLM provider
- [ ] **LLM_BASE_URL** - Set to `https://api.openai.com/v1` (or your provider)
- [ ] **LLM_MODEL** - Set to `gpt-4o-mini` (or your model)
- [ ] **TZ** - Set to `Africa/Johannesburg`
- [ ] **DEFAULT_CURRENCY** - Set to `ZAR`

---

## 💡 Tips

1. **Start with essentials**: You can deploy with just Database, Clerk, and Secrets. Add integrations later.

2. **Google Ads takes time**: The developer token approval can take 24-48 hours. You can deploy without it and add it later.

3. **Test vs Production keys**: Use test keys (like `pk_test_` for Clerk) during development, then switch to production keys later.

4. **Save your keys securely**: Consider using a password manager to store all these values.

5. **OAuth redirects**: Set these up AFTER you have your Vercel deployment URL.

---

## 🆘 Need Help?

If you get stuck on any step:
- Check the official documentation for each service
- Make sure you're using the correct account type (Business/Developer accounts)
- Some services require verification or approval processes

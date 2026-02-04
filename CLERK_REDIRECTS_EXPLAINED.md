# Clerk Redirects - Where They're Configured

## Understanding Clerk Redirects

Clerk handles redirects in two places:
1. **Component Paths** (in Clerk Dashboard) - Where sign-in/sign-up pages are
2. **After Authentication Redirects** (Environment Variables) - Where users go after signing in/up

## What You See in Clerk Dashboard

In the "Paths" section, you'll see:

### Development Host
- **Fallback development host**: For local development (e.g., `http://localhost:3000`)
- Leave blank or set to `http://localhost:3000` for local dev

### Application Paths
- **Home URL**: Your app's homepage (leave blank if at root `/`)
- **Unauthorized sign in URL**: Where to send unauthorized users (optional)

### Component Paths (Separate Section)
- **SignIn component**: Set to "development host" with path `/sign-in`
- **SignUp component**: Set to "development host" with path `/sign-up`

## Where "After Sign-In/Up" Redirects Are Set

**Important:** The "After sign-in" and "After sign-up" redirects are NOT in the Clerk dashboard. They're configured via **environment variables** in Vercel.

### In Vercel Environment Variables, Set:

```
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app
```

These tell Clerk where to redirect users after they successfully authenticate.

## Complete Flow

1. **User clicks "Sign In"** → Goes to `/sign-in` (from Component Paths config)
2. **User signs in successfully** → Redirected to `/app` (from `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`)
3. **User clicks "Sign Up"** → Goes to `/sign-up` (from Component Paths config)
4. **User signs up successfully** → Redirected to `/app` (from `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`)

## Summary

| Setting | Where It's Configured | Value |
|---------|----------------------|-------|
| Sign-in page location | Clerk Dashboard → Paths → Component Paths | `/sign-in` (development host) |
| Sign-up page location | Clerk Dashboard → Paths → Component Paths | `/sign-up` (development host) |
| After sign-in redirect | Vercel Environment Variables | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app` |
| After sign-up redirect | Vercel Environment Variables | `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app` |

## What to Do

1. **In Clerk Dashboard:**
   - Set Component Paths to use "development host" with `/sign-in` and `/sign-up`
   - Leave Application Paths mostly blank (or set Home URL if needed)

2. **In Vercel Environment Variables:**
   - Add `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app`
   - Add `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app`

That's it! The redirects after authentication are handled by environment variables, not the dashboard.

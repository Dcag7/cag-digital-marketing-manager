# Neon Database Connection Guide - Step by Step

## How to Get Both Connection Strings from Neon

### Step 1: Open the Connection Modal

1. Go to https://console.neon.tech
2. Select your project
3. Click the **"Connect"** button (top right)
4. The "Connect to your database" modal will open

### Step 2: Get the Pooled Connection (DATABASE_URL)

**This is for your application runtime:**

1. In the modal, find the **"Connection pooling"** toggle switch
2. Make sure it's **ON** (green/enabled) - this is usually the default
3. Look at the connection string - you should see `-pooler` in the hostname
   - Example: `ep-aged-wind-agx6iyay-**pooler**.c-2.eu-central-1.aws.neon.tech`
4. Click **"Show password"** (eye icon) to reveal the password
5. Click **"Copy snippet"** to copy the entire connection string
6. **This is your `DATABASE_URL`**

**What it looks like:**
```
postgresql://neondb_owner:your-password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

### Step 3: Get the Direct Connection (DIRECT_URL)

**This is for running migrations:**

1. In the same modal, toggle **"Connection pooling"** to **OFF** (grey/disabled)
2. The connection string will update - notice the hostname changes
3. The `-pooler` part should disappear from the hostname
   - Example: `ep-aged-wind-agx6iyay.c-2.eu-central-1.aws.neon.tech` (no `-pooler`)
4. Click **"Show password"** again (if needed)
5. Click **"Copy snippet"** to copy this connection string
6. **This is your `DIRECT_URL`**

**What it looks like:**
```
postgresql://neondb_owner:your-password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### Visual Guide

**When Connection Pooling is ON (Pooled - for DATABASE_URL):**
```
Hostname: ep-xxx-pooler.region.aws.neon.tech
         ↑ Notice the "-pooler" part
```

**When Connection Pooling is OFF (Direct - for DIRECT_URL):**
```
Hostname: ep-xxx.region.aws.neon.tech
         ↑ No "-pooler" part
```

### Quick Checklist

- [ ] Opened "Connect to your database" modal
- [ ] Connection pooling ON → Copied connection string → This is `DATABASE_URL`
- [ ] Connection pooling OFF → Copied connection string → This is `DIRECT_URL`
- [ ] Both strings have the password revealed and copied

### Important Notes

1. **Same password**: Both connections use the same password, but different hostnames
2. **Use pooled for app**: `DATABASE_URL` (with `-pooler`) is for your Vercel deployment
3. **Use direct for migrations**: `DIRECT_URL` (without `-pooler`) is for running Prisma migrations
4. **Password security**: Neon saves your password securely. You can reset it if needed using the "Reset password" link

### Troubleshooting

**Can't see the toggle?**
- Make sure you're in the "Connect" tab of your project dashboard
- The modal should be open

**Connection string looks the same?**
- Check the hostname carefully - look for `-pooler` in the hostname
- Pooled: `ep-xxx-pooler.region.aws.neon.tech`
- Direct: `ep-xxx.region.aws.neon.tech`

**Need to reset password?**
- Click "Reset password" next to the Role dropdown
- This will generate a new password for both connections

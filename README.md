# Growth OS - Digital Marketing Manager

Production-grade, multi-tenant "Growth OS" web platform that can replace a digital marketing manager for eCommerce brands. Agentic (LLM-assisted) but approve-first for any execution.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Auth**: Clerk
- **ORM**: Prisma
- **DB**: Neon Postgres (serverless-safe)
- **Hosting**: Vercel
- **Background**: Vercel Cron + server actions
- **Validation**: Zod
- **Timezone**: Africa/Johannesburg
- **Currency**: ZAR

## Setup

### 1. Prerequisites

- Node.js 18+
- Neon Postgres database
- Clerk account
- Meta Marketing API app
- Shopify app
- Google Ads API access

### 2. Database Setup (Neon)

1. Create a Neon project at https://neon.tech
2. Copy the connection strings:
   - `DATABASE_URL`: Use the pooled connection (with `?pgbouncer=true`)
   - `DIRECT_URL`: Use the direct connection (for migrations)

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

**Critical**: Generate a 32-byte base64 encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Database Migration

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations (uses DIRECT_URL)
npm run db:migrate
```

### 6. OAuth Setup

#### Meta Marketing API
1. Create app in Meta Developers (https://developers.facebook.com)
2. Add Marketing API product
3. Set redirect URI: `https://yourdomain.com/api/integrations/meta/callback`
4. Add `META_APP_ID` and `META_APP_SECRET` to `.env.local`

#### Shopify
1. Create app in Shopify Partners (https://partners.shopify.com)
2. Set redirect URI: `https://yourdomain.com/api/integrations/shopify/callback`
3. Add `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` to `.env.local`

#### Google Ads
1. Create OAuth 2.0 credentials in Google Cloud Console
2. Add to Google Ads API Center
3. Set redirect URI: `https://yourdomain.com/api/integrations/google/callback`
4. Add credentials to `.env.local`

### 7. Vercel Cron Setup

In Vercel dashboard, add cron jobs:

- `/api/cron/meta` - Daily at 2 AM SAST
- `/api/cron/shopify` - Daily at 2:30 AM SAST
- `/api/cron/google` - Daily at 3 AM SAST

Protect with `CRON_SECRET` header in Authorization: `Bearer ${CRON_SECRET}`

### 8. Run Development Server

```bash
npm run dev
```

## Security Notes

- **Approve-first execution**: All agent recommendations require human approval
- **Guardrails**: Enforced at execution time (budget limits, pause limits, etc.)
- **Audit logs**: Every action is logged with before/after states
- **Encryption**: All integration tokens encrypted at rest (AES-256-GCM)
- **Server-only**: Secrets never sent to client
- **Workspace scoping**: All queries filtered by `workspaceId`

## Architecture

### Multi-tenancy
- Workspaces (clients) with strict isolation
- Role-based access control (OWNER, ADMIN, OPERATOR, VIEWER)
- All queries scoped by `workspaceId`

### Agent System
- Rules-first: Deterministic thresholds identify winners/losers
- LLM second: Explains "why" and generates creative briefs
- Recommendations stored with full audit trail

### Integrations
- Meta Marketing API (campaigns, ad sets, ads, insights)
- Shopify (orders, products, revenue)
- Google Ads (campaigns, ad groups, ads, metrics)

## Development

### Adding New Features

1. Update Prisma schema if needed
2. Run `npm run db:migrate`
3. Implement server actions
4. Build UI components
5. Add audit logging

### Testing

- Use Prisma Studio: `npm run db:studio`
- Check audit logs in `/app/:workspaceId/audit`
- Verify encryption in `EncryptedSecret` table

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy via Vercel Dashboard**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Configure environment variables (see DEPLOYMENT.md)
   - Deploy!

3. **Run Database Migrations**
   ```bash
   # Use DIRECT_URL from Neon
   DATABASE_URL="<your-direct-url>" npm run db:migrate
   ```

4. **Set Up Cron Jobs**
   - Configure in Vercel Dashboard → Settings → Cron Jobs
   - Or use the `vercel.json` file (requires Pro plan)

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

Proprietary

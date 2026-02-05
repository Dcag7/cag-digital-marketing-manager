# Growth OS - Digital Marketing Manager

Production-grade, multi-tenant "Growth OS" web platform that can replace a digital marketing manager for eCommerce brands. Agentic (LLM-assisted) but approve-first for any execution.

## Features

- **Multi-channel support**: Meta (Facebook/Instagram), Google Ads, Shopify
- **AI-powered recommendations**: Rules-based analysis with LLM explanations
- **Approve-first execution**: All actions require human approval before execution
- **Real-time dashboards**: KPI tracking, channel performance, profit analysis
- **Creative intelligence**: Automated creative briefs based on performance data
- **Guardrails**: Configurable safety limits for automated actions
- **Full audit trail**: Every action logged with before/after states
- **Multi-tenant**: Workspace isolation with role-based access control

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Auth**: Clerk
- **ORM**: Prisma
- **DB**: Neon Postgres (serverless-safe)
- **Hosting**: Vercel
- **Background**: Vercel Cron + server actions
- **Testing**: Vitest
- **Validation**: Zod
- **Encryption**: AES-256-GCM
- **Timezone**: Africa/Johannesburg
- **Currency**: ZAR

## Quick Start

### Prerequisites

- Node.js 18+
- Neon Postgres database
- Clerk account
- (Optional) Meta Marketing API app
- (Optional) Shopify Partners app
- (Optional) Google Ads API access

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd cag-digital-marketing-manager

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Add the output to ENCRYPTION_KEY in .env.local

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

See `.env.example` for all required variables. Critical ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection (for migrations) |
| `CLERK_SECRET_KEY` | Clerk authentication secret |
| `ENCRYPTION_KEY` | 32-byte base64 key for token encryption |
| `LLM_API_KEY` | OpenAI or compatible API key |
| `CRON_SECRET` | Secret for authenticating cron jobs |

## Integration Setup

### Meta Marketing API

1. Go to [Meta Developers](https://developers.facebook.com) and create a new app
2. Add the **Marketing API** product to your app
3. Configure OAuth settings:
   - Valid OAuth Redirect URIs: `https://yourdomain.com/api/integrations/meta/callback`
   - Deauthorize Callback URL: `https://yourdomain.com/api/integrations/meta/deauthorize`
4. Request required permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
   - `pages_read_engagement`
5. Add credentials to `.env.local`:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   ```

### Shopify

1. Go to [Shopify Partners](https://partners.shopify.com) and create an app
2. Configure app URLs:
   - App URL: `https://yourdomain.com`
   - Allowed redirection URLs: `https://yourdomain.com/api/integrations/shopify/callback`
3. Request required scopes:
   - `read_orders`
   - `read_products`
   - `read_inventory`
   - `read_analytics`
4. Add credentials to `.env.local`:
   ```
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   ```

### Google Ads

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Google Ads API**
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://yourdomain.com/api/integrations/google/callback`
5. Apply for Google Ads API access:
   - Go to [Google Ads API Center](https://ads.google.com/aw/apicenter)
   - Apply for a developer token
6. Add credentials to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_DEVELOPER_TOKEN=your_developer_token
   ```

### LLM Configuration

The app supports any OpenAI-compatible API:

```env
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1  # or your compatible endpoint
LLM_MODEL=gpt-4o-mini  # or gpt-4o, claude-3-sonnet, etc.
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── cron/           # Cron job routes
│   │   └── integrations/   # OAuth callback routes
│   ├── app/
│   │   └── [workspaceId]/  # Workspace pages
│   ├── sign-in/            # Auth pages
│   └── sign-up/
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── agent/              # Rules engine & generator
│   ├── llm/                # LLM client
│   ├── metrics/            # Metrics calculator
│   └── utils.ts
├── server/
│   ├── actions/            # Server actions
│   └── adapters/           # Platform adapters
├── prisma/
│   └── schema.prisma       # Database schema
└── scripts/                # Utility scripts
```

## Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations (dev)
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage

# Utilities
npm run secrets:generate  # Generate encryption key
npm run migrate:deploy    # Deploy migrations (production)
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy!

### Database Migrations (Production)

```bash
# Set DATABASE_URL to your DIRECT_URL (not pooled)
DATABASE_URL="postgresql://..." npm run migrate:deploy
```

### Cron Jobs

Add these cron jobs in Vercel Dashboard → Settings → Cron Jobs:

| Route | Schedule | Description |
|-------|----------|-------------|
| `/api/cron/meta` | `0 0 * * *` | Sync Meta insights daily |
| `/api/cron/shopify` | `30 0 * * *` | Sync Shopify orders daily |
| `/api/cron/google` | `0 1 * * *` | Sync Google Ads daily |

Or use `vercel.json` (requires Pro plan):

```json
{
  "crons": [
    { "path": "/api/cron/meta", "schedule": "0 0 * * *" },
    { "path": "/api/cron/shopify", "schedule": "30 0 * * *" },
    { "path": "/api/cron/google", "schedule": "0 1 * * *" }
  ]
}
```

## Security

- **Approve-first execution**: All agent recommendations require human approval
- **Guardrails**: Configurable limits (max budget change %, max pauses/day, etc.)
- **Audit logs**: Every action logged with before/after states
- **Encryption**: All integration tokens encrypted at rest (AES-256-GCM)
- **Server-only secrets**: Credentials never sent to client
- **Workspace isolation**: All queries scoped by `workspaceId`
- **Role-based access**: OWNER, ADMIN, OPERATOR, VIEWER roles

## Architecture

### Data Flow

```
Cron Jobs → Platform Adapters → Database
                                    ↓
Dashboard ← Metrics Calculator ← Insights
                                    ↓
                             Rules Engine
                                    ↓
                        LLM Generator (explains "why")
                                    ↓
                            Recommendations
                                    ↓
                        Human Approval (required)
                                    ↓
                              Executor → Platform APIs
```

### Agent System

1. **Rules Engine**: Deterministic thresholds identify winners/losers
2. **LLM Generator**: Explains analysis and generates creative briefs
3. **Recommendations**: Stored with full audit trail
4. **Execution**: Only after human approval, with guardrail enforcement

## Troubleshooting

### OAuth Errors

- Ensure redirect URIs match exactly (including trailing slashes)
- Check that required scopes/permissions are granted
- Verify credentials are correctly set in environment variables

### Database Issues

- Use `DIRECT_URL` for migrations, `DATABASE_URL` for app
- Run `npm run db:generate` after schema changes
- Check Neon dashboard for connection limits

### Cron Jobs Not Running

- Verify `CRON_SECRET` is set in environment
- Check Vercel function logs for errors
- Ensure integrations are in `CONNECTED` status

### LLM Errors

- Verify API key is valid and has sufficient credits
- Check `LLM_BASE_URL` points to correct endpoint
- Ensure `LLM_MODEL` is supported by your provider

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:run`
5. Submit a pull request

## License

Proprietary - All rights reserved

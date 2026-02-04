#!/bin/bash

# Growth OS Deployment Script
# This script helps prepare and deploy the application

set -e

echo "🚀 Growth OS Deployment Helper"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  Warning: .env.local not found"
    echo "   Please create it from .env.example and fill in all values"
    echo ""
fi

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git initialized"
    echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate
echo "✅ Prisma client generated"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
    echo "✅ Vercel CLI installed"
    echo ""
fi

echo "📋 Pre-deployment checklist:"
echo "   [ ] All environment variables set in Vercel"
echo "   [ ] Database migrations run (use DIRECT_URL)"
echo "   [ ] OAuth redirect URLs configured"
echo "   [ ] Cron jobs set up in Vercel"
echo ""
echo "Ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Push code to GitHub: git push origin main"
echo "2. Deploy via Vercel Dashboard or run: vercel --prod"
echo "3. Run migrations: DATABASE_URL=<direct-url> npm run db:migrate"
echo ""

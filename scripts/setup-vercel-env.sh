#!/bin/bash

# Helper script to guide you through Vercel environment variable setup
# This script doesn't actually set variables (requires Vercel API access)
# It generates a checklist and values you need

echo "🚀 Vercel Environment Variables Setup Helper"
echo "==========================================="
echo ""
echo "This script will help you prepare all environment variables."
echo "You'll need to manually add them in Vercel Dashboard."
echo ""

# Generate secrets
echo "📝 Generating secrets..."
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo ""
echo "✅ Secrets generated!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COPY THESE VALUES TO VERCEL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""
echo "CRON_SECRET=$CRON_SECRET"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Read .env.example if it exists
if [ -f .env.example ]; then
    echo "📄 Found .env.example - showing all required variables:"
    echo ""
    grep -v "^#" .env.example | grep -v "^$" | while IFS= read -r line; do
        var_name=$(echo "$line" | cut -d'=' -f1)
        echo "  ✓ $var_name"
    done
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to: Settings → Environment Variables"
echo "4. Add each variable from the list above"
echo "5. Make sure to select: Production, Preview, Development"
echo "6. Redeploy your project after adding variables"
echo ""
echo "For detailed instructions, see: SETUP_GUIDE.md"
echo ""

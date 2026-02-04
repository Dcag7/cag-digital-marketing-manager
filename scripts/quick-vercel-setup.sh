#!/bin/bash

# Quick Vercel Setup Script
# Run this after you've logged in to Vercel

echo "🚀 Quick Vercel Setup"
echo "===================="
echo ""

# Check login
if ! vercel whoami &>/dev/null; then
    echo "❌ Not logged in to Vercel"
    echo "   Run: vercel login"
    exit 1
fi

echo "✅ Logged in as: $(vercel whoami)"
echo ""

# Link project
echo "🔗 Linking project to Vercel..."
vercel link --yes

echo ""
echo "✅ Project linked!"
echo ""
echo "📝 Next steps:"
echo "1. Add environment variables in Vercel Dashboard"
echo "2. Or use: vercel env add <NAME> for each variable"
echo "3. See VERCEL_SETUP.md for full list"
echo ""
echo "🚀 To deploy:"
echo "   vercel --prod"
echo ""

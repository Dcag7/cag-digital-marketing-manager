#!/bin/bash

# Vercel Setup Helper Script
# This guides you through connecting your project to Vercel

echo "🚀 Vercel Setup Helper"
echo "======================"
echo ""

# Check if logged in
if vercel whoami &>/dev/null; then
    echo "✅ Already logged in to Vercel"
    vercel whoami
    echo ""
else
    echo "📝 You need to log in to Vercel first"
    echo "   Run: vercel login"
    echo "   This will open your browser for authentication"
    echo ""
    read -p "Press Enter after you've logged in, or Ctrl+C to exit..."
fi

echo "🔗 Linking project to Vercel..."
echo ""

# Link project (this will ask questions)
vercel link

echo ""
echo "✅ Project linked!"
echo ""
echo "Next steps:"
echo "1. Add environment variables (see SETUP_GUIDE.md)"
echo "2. Deploy: vercel --prod"
echo ""

#!/bin/bash

# Drop Craft AI - Production Deployment Script
# Supports Vercel (Frontend) + Railway/Fly.io (Backend) + Supabase (Database)

set -e

echo "🚀 Starting Drop Craft AI deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if environment is specified
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify environment (staging|production)${NC}"
    echo "Usage: ./scripts/deploy.sh [staging|production]"
    exit 1
fi

ENVIRONMENT=$1

echo -e "${YELLOW}Deploying to: $ENVIRONMENT${NC}"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}Error: .env.$ENVIRONMENT file not found${NC}"
    exit 1
fi

# Check required tools
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        exit 1
    fi
}

echo "🔍 Checking required tools..."
check_tool npm
check_tool git

# Run tests if they exist
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo "🧪 Running tests..."
    npm test
    echo -e "${GREEN}✓ Tests passed${NC}"
fi

# Build the application
echo "🏗️  Building application..."
npm run build
echo -e "${GREEN}✓ Build completed${NC}"

# Deploy to Vercel (Frontend)
if command -v vercel &> /dev/null; then
    echo "🌐 Deploying frontend to Vercel..."
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel --prod --yes
    else
        vercel --yes
    fi
    echo -e "${GREEN}✓ Frontend deployed to Vercel${NC}"
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Manual deployment required.${NC}"
    echo "Install: npm i -g vercel"
fi

# Deploy to Railway (if railway.json exists)
if [ -f "railway.json" ] && command -v railway &> /dev/null; then
    echo "🚂 Deploying to Railway..."
    railway up
    echo -e "${GREEN}✓ Railway deployment completed${NC}"
elif [ -f "railway.json" ]; then
    echo -e "${YELLOW}⚠️  Railway CLI not found. Manual deployment required.${NC}"
    echo "Install: npm i -g @railway/cli"
fi

# Deploy to Fly.io (if fly.toml exists)
if [ -f "fly.toml" ] && command -v flyctl &> /dev/null; then
    echo "🪰 Deploying to Fly.io..."
    flyctl deploy
    echo -e "${GREEN}✓ Fly.io deployment completed${NC}"
elif [ -f "fly.toml" ]; then
    echo -e "${YELLOW}⚠️  Fly.io CLI not found. Manual deployment required.${NC}"
    echo "Install: curl -L https://fly.io/install.sh | sh"
fi

# Sync Supabase functions
if command -v supabase &> /dev/null; then
    echo "🗄️  Syncing Supabase functions..."
    supabase functions deploy --project-ref dtozyrmmekdnvekissuh
    echo -e "${GREEN}✓ Supabase functions deployed${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Functions not deployed.${NC}"
    echo "Install: npm i -g supabase"
fi

# Run post-deployment health checks
echo "🏥 Running health checks..."

# Check if main application is accessible
if [ ! -z "$VITE_FRONTEND_URL" ]; then
    if curl -s "$VITE_FRONTEND_URL" > /dev/null; then
        echo -e "${GREEN}✓ Frontend is accessible${NC}"
    else
        echo -e "${RED}✗ Frontend health check failed${NC}"
    fi
fi

# Check Supabase connectivity
if [ ! -z "$VITE_SUPABASE_URL" ]; then
    if curl -s "$VITE_SUPABASE_URL/health" > /dev/null; then
        echo -e "${GREEN}✓ Supabase is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Supabase health check inconclusive${NC}"
    fi
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "📋 Post-deployment checklist:"
echo "  1. Verify all integrations are working"
echo "  2. Check monitoring dashboards"
echo "  3. Test key user flows"
echo "  4. Monitor error logs for 24h"
echo ""
echo "🔗 Useful links:"
echo "  • Frontend: $VITE_FRONTEND_URL"
echo "  • Supabase: https://supabase.com/dashboard/project/dtozyrmmekdnvekissuh"
echo "  • GitHub: https://github.com/adil95400/drop-craft-ai"
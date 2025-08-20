# Drop Craft AI - Deployment Guide

Complete guide for deploying Drop Craft AI SaaS to production.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vercel)      │────│ (Railway/Fly.io)│────│   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│  Edge Functions │──────────────┘
                        │   (Supabase)    │
                        └─────────────────┘
```

## 🚀 Quick Deploy

```bash
# 1. Setup environment
./scripts/setup.sh

# 2. Configure API keys (edit .env.production)
nano .env.production

# 3. Deploy to production
./scripts/deploy.sh production
```

## 📋 Prerequisites

### Required Accounts
- [GitHub](https://github.com) - Code repository
- [Vercel](https://vercel.com) - Frontend hosting
- [Supabase](https://supabase.com) - Database & backend
- [Railway](https://railway.app) OR [Fly.io](https://fly.io) - Optional backend hosting

### Required Tools
```bash
# Install Node.js 18+
curl -fsSL https://nodejs.org/dist/v18.x/node-v18.x.x-linux-x64.tar.xz

# Install CLI tools
npm install -g vercel supabase @railway/cli

# Or install Fly.io CLI
curl -L https://fly.io/install.sh | sh
```

## ⚙️ Environment Configuration

### 1. Core Environment Variables

```bash
# .env.production
NODE_ENV=production
VITE_APP_ENV=production

# Supabase
VITE_SUPABASE_URL=https://dtozyrmmekdnvekissuh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Feature Flags
VITE_ALIEXPRESS_ENABLED=true
VITE_BIGBUY_ENABLED=true
VITE_SHOPIFY_ENABLED=true
VITE_AI_OPTIMIZATION_ENABLED=true
```

### 2. API Keys Configuration

Add these secrets to your Supabase Edge Functions:

```bash
# E-commerce APIs
ALIEXPRESS_API_KEY=your_aliexpress_key
BIGBUY_API_KEY=your_bigbuy_key
SHOPIFY_API_KEY=your_shopify_key
AMAZON_ACCESS_KEY_ID=your_amazon_key
EBAY_CLIENT_ID=your_ebay_key

# AI & Analytics
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_key

# Tracking & Shipping
TRACK17_API_KEY=your_tracking_key
AFTERSHIP_API_KEY=your_aftership_key
```

## 🔧 Deployment Steps

### 1. Prepare Repository

```bash
# Clone and setup
git clone https://github.com/adil95400/drop-craft-ai.git
cd drop-craft-ai
./scripts/setup.sh
```

### 2. Configure Supabase

```bash
# Link to project
supabase link --project-ref dtozyrmmekdnvekissuh

# Deploy edge functions
supabase functions deploy --project-ref dtozyrmmekdnvekissuh

# Set up secrets
supabase secrets set --project-ref dtozyrmmekdnvekissuh ALIEXPRESS_API_KEY=your_key
supabase secrets set --project-ref dtozyrmmekdnvekissuh OPENAI_API_KEY=your_key
# ... add all other secrets
```

### 3. Deploy Frontend (Vercel)

```bash
# Install and configure Vercel
npm install -g vercel
vercel login

# Deploy
vercel --prod

# Or use the GitHub integration:
# 1. Connect your GitHub repo to Vercel
# 2. Set environment variables in Vercel dashboard
# 3. Deploy automatically on push to main
```

### 4. Deploy Backend (Railway - Option A)

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Initialize and deploy
railway init
railway up
```

### 5. Deploy Backend (Fly.io - Option B)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh
flyctl auth login

# Initialize and deploy
flyctl launch
flyctl deploy
```

## 🔍 Health Checks

### Automated Health Checks

The deployment script includes automatic health checks:

```bash
# Check frontend
curl https://drop-craft-ai.vercel.app/health.json

# Check Supabase functions
curl https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/health

# Run full health check
./scripts/health-check.sh
```

### Manual Verification

1. **Frontend**: Visit your deployed URL
2. **Database**: Check Supabase dashboard
3. **Integrations**: Test API connections
4. **Functions**: Check edge function logs

## 📊 Monitoring Setup

### 1. Supabase Monitoring

- Database metrics: CPU, memory, connections
- Function logs and errors
- Real-time usage statistics

### 2. Vercel Analytics

- Core Web Vitals
- Page load times
- Error tracking

### 3. Optional: Sentry Integration

```javascript
// src/main.tsx
import * as Sentry from "@sentry/react"

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "your_sentry_dsn",
    environment: "production"
  })
}
```

## 🔄 CI/CD Pipeline

The included GitHub Actions workflow automatically:

1. Runs tests and linting
2. Builds the application
3. Deploys to Vercel
4. Updates Supabase functions
5. Runs health checks

### Workflow Configuration

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🔐 Security Considerations

### 1. API Key Management

- ✅ Store in Supabase secrets (encrypted)
- ✅ Use environment-specific keys
- ✅ Rotate keys regularly
- ❌ Never commit keys to repository

### 2. Database Security

- ✅ Row-Level Security (RLS) enabled
- ✅ API rate limiting
- ✅ Input validation
- ✅ Audit logging

### 3. GDPR Compliance

- ✅ Data anonymization features
- ✅ User data export
- ✅ Right to deletion
- ✅ Privacy policy compliance

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### 2. Function Deploy Errors
```bash
# Check function logs
supabase functions logs --project-ref dtozyrmmekdnvekissuh

# Redeploy specific function
supabase functions deploy function-name --project-ref dtozyrmmekdnvekissuh
```

#### 3. API Connection Issues
```bash
# Test API connectivity
curl -X POST https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/aliexpress-integration \
  -H "Authorization: Bearer your_token" \
  -d '{"test": true}'
```

#### 4. Database Connection Issues
```bash
# Check database status
supabase status --project-ref dtozyrmmekdnvekissuh

# Test connection
supabase db remote --project-ref dtozyrmmekdnvekissuh
```

### Getting Help

1. **Logs**: Check application and function logs
2. **Documentation**: Review API documentation
3. **Community**: GitHub Issues and Discussions
4. **Support**: Contact platform support if needed

## 📈 Scaling Considerations

### Database Scaling
- Monitor connection pool usage
- Add read replicas if needed
- Optimize queries and indexes

### Function Scaling  
- Monitor execution time and memory
- Implement caching strategies
- Use background jobs for heavy tasks

### Frontend Scaling
- Enable Vercel's Edge Network
- Implement proper caching headers
- Optimize bundle size

## 🎯 Production Checklist

- [ ] All environment variables configured
- [ ] API keys added to Supabase secrets
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team access configured
- [ ] SSL certificates valid

## 🔄 Maintenance

### Daily Tasks
- Monitor error rates and performance
- Check integration health
- Review user activity logs

### Weekly Tasks  
- Update dependencies
- Review and rotate API keys
- Backup critical data
- Performance optimization

### Monthly Tasks
- Security audit
- Cost optimization review
- Feature usage analysis
- Documentation updates

---

For additional help, check the [README.md](../README.md) or open an issue on [GitHub](https://github.com/adil95400/drop-craft-ai/issues).
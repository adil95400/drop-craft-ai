# Drop Craft AI - SaaS Dropshipping Platform

🚀 **Real SaaS E-commerce/Dropshipping Platform** - 100% functional with real data from suppliers and stores.

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/adil95400/drop-craft-ai.git
cd drop-craft-ai

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Install dependencies (requires pnpm)
pnpm install

# Start development
pnpm dev
```

**Frontend:** http://localhost:8080  
**API:** http://localhost:8000

## Architecture

### Monorepo Structure
```
drop-craft-ai/
├── apps/
│   ├── web/          # React + Vite + TypeScript frontend
│   └── api/          # FastAPI Python backend
├── supabase/         # Database & Edge Functions
├── scripts/          # Deployment & sync scripts
└── docs/            # Documentation
```

### Tech Stack
- **Frontend:** React 18, Vite, TypeScript, shadcn/ui, TanStack Query, React Router
- **Backend:** FastAPI, Python 3.11, Supabase, PostgreSQL
- **Database:** Supabase (Postgres) with RLS
- **Deployment:** Vercel (Web) + Railway/Fly.io (API) + Supabase (DB)
- **CI/CD:** GitHub Actions

## 🔧 Features

### Core Functionality
- ✅ **Real Shopify Integration** - OAuth, sync products/orders
- ✅ **BigBuy Supplier** - Real catalog import & sync
- ✅ **17Track Integration** - Real package tracking
- ✅ **OpenAI SEO** - AI-generated product descriptions
- ✅ **Multi-format Import** - CSV, XML, URL scraping, FTP
- ✅ **Real Export** - CSV/XML product export
- ✅ **Audit Trail** - Complete logging system

### Import Methods
1. **URL Import** - Scrape products from supplier URLs
2. **CSV Import** - Drag & drop with visual column mapping
3. **XML Feed** - Automated feed parsing & sync
4. **FTP Sync** - Scheduled FTP directory imports
5. **API Suppliers** - BigBuy, AliExpress, Cdiscount Pro, Eprolo

## 🚀 Deployment

### Automated Deployment
```bash
# Deploy everything
./scripts/deploy.sh

# Or individual components
pnpm --filter apps/web deploy  # Vercel
pnpm --filter apps/api deploy  # Railway
```

## 📊 Real Data Operations

### 1. Import Products
```bash
# Real BigBuy sync
curl -X POST "http://localhost:8000/api/suppliers/bigbuy/sync"

# CSV import with mapping
curl -X POST "http://localhost:8000/api/import/csv" -F "file=@products.csv"

# URL scraping
curl -X POST "http://localhost:8000/api/import/url" -d '{"url": "https://supplier.com/product/12345"}'
```

### 2. Shopify Integration
```bash
# Connect store
curl -X POST "http://localhost:8000/api/shopify/connect" -d '{"shop_domain": "mystore.myshopify.com"}'

# Sync products to Shopify
curl -X POST "http://localhost:8000/api/shopify/sync-products" -d '{"product_ids": ["uuid1", "uuid2"]}'
```

### 3. AI SEO Generation
```bash
curl -X POST "http://localhost:8000/api/ai/seo" -d '{"product_id": "uuid", "language": "fr"}'
```

## 🔐 Environment Configuration

### Required API Keys
```bash
# Essential integrations
SHOPIFY_CLIENT_ID=your_key        # Required for Shopify
SHOPIFY_CLIENT_SECRET=your_secret
BIGBUY_API_KEY=your_key          # Required for BigBuy
SEVENTEENTRACK_API_KEY=your_key   # Required for tracking
OPENAI_API_KEY=your_key          # Required for AI features

# Optional integrations (can be disabled)
ALIEXPRESS_API_KEY=your_key      # Set ALIEXPRESS_ENABLED=false if not available
CDISCOUNT_API_KEY=your_key       # Set CDISCOUNT_ENABLED=false if not available
EPROLO_API_KEY=your_key          # Set EPROLO_ENABLED=false if not available
```

### Feature Flags
All integrations can be toggled:
```bash
SHOPIFY_ENABLED=true      # Shopify integration
BIGBUY_ENABLED=true       # BigBuy supplier
ALIEXPRESS_ENABLED=false  # AliExpress (optional)
CDISCOUNT_ENABLED=false   # Cdiscount Pro (optional)  
EPROLO_ENABLED=false      # Eprolo (optional)
SEVENTEENTRACK_ENABLED=true # Package tracking
OPENAI_ENABLED=true       # AI features
```

## 📋 Definition of Done Checklist

✅ **Real Data Import**
- [ ] Import from BigBuy API (real products)
- [ ] Import via CSV/XML (real files)
- [ ] Import via URL scraping (real websites)
- [ ] Products visible in catalog with real data

✅ **Shopify Integration**
- [ ] OAuth connection working
- [ ] Push products to real Shopify store
- [ ] Pull real orders from Shopify
- [ ] Products visible in Shopify admin

✅ **AI & Tracking**
- [ ] OpenAI generates real SEO content
- [ ] 17Track updates real tracking status
- [ ] All data persisted in database

✅ **Export & Analytics**
- [ ] Export catalog to CSV (real data)
- [ ] Dashboard shows real metrics  
- [ ] Audit logs capture all actions

✅ **Deployment**
- [ ] CI/CD pipeline passes
- [ ] Web app deployed to Vercel
- [ ] API deployed to Railway/Fly.io
- [ ] Health checks pass

---

**⚠️ Important:** This is a real SaaS platform with live integrations. Always use test/sandbox modes when available and validate all API keys before production deployment.

🚀 **Ready to launch your dropshipping empire!**
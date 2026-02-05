# ShopOpti FastAPI Backend

## Architecture

```
apps/api/
├── main.py                    # Application entry point
├── app/
│   ├── core/
│   │   ├── config.py          # Pydantic settings
│   │   ├── database.py        # Supabase client
│   │   └── security.py        # JWT validation
│   ├── api/
│   │   ├── v1/
│   │   │   ├── router.py      # API v1 routes
│   │   │   └── endpoints/     # Endpoint modules
│   │   └── legacy.py          # Legacy compatibility
│   ├── queue/
│   │   ├── celery_app.py      # Celery configuration
│   │   ├── tasks.py           # Async task definitions
│   │   └── redis_queue.py     # Redis utilities
│   └── services/
│       ├── ai.py              # AI content generation
│       ├── scraping.py        # Web scraping
│       ├── import_service.py  # CSV/XML/JSON imports
│       ├── fulfillment.py     # Order fulfillment
│       ├── pricing.py         # Dynamic pricing
│       └── suppliers/         # Supplier integrations
│           ├── base.py
│           ├── bigbuy.py
│           └── aliexpress.py
├── fly.toml                   # Fly.io deployment
├── Dockerfile                 # Container config
└── requirements.txt           # Python dependencies
```

## Quick Start

### Local Development

```bash
cd apps/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your credentials

# Start Redis (required for Celery)
docker run -d -p 6379:6379 redis:alpine

# Run API server
uvicorn main:app --reload --port 8000

# Run Celery worker (in another terminal)
celery -A app.queue.celery_app worker --loglevel=info
```

### Docker Compose

```bash
docker-compose up -d
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| SUPABASE_URL | Supabase project URL | Yes |
| SUPABASE_KEY | Supabase anon key | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key | Yes |
| DATABASE_URL | PostgreSQL connection string | Yes |
| REDIS_URL | Redis connection URL | Yes |
| JWT_SECRET | JWT signing secret (same as Supabase) | Yes |
| BIGBUY_API_KEY | BigBuy API key | No |
| ALIEXPRESS_API_KEY | AliExpress API key | No |
| FIRECRAWL_API_KEY | Firecrawl API key (for scraping) | No |
| LOVABLE_API_KEY | Lovable AI Gateway key | No |

## API Endpoints

### Suppliers
- `POST /api/v1/suppliers/connect` - Connect new supplier
- `POST /api/v1/suppliers/sync` - Trigger supplier sync
- `GET /api/v1/suppliers/list` - List connected suppliers
- `GET /api/v1/suppliers/{id}/status` - Get supplier status

### Products
- `GET /api/v1/products` - List products with filters
- `POST /api/v1/products` - Create product
- `PATCH /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product
- `POST /api/v1/products/bulk-price-update` - Bulk price update

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders/fulfill` - Fulfill single order
- `POST /api/v1/orders/bulk-fulfill` - Bulk fulfillment

### Sync
- `POST /api/v1/sync/trigger` - Trigger sync job
- `POST /api/v1/sync/schedule` - Create sync schedule
- `GET /api/v1/sync/schedules` - List schedules
- `GET /api/v1/sync/history` - Get sync history

### Scraping
- `POST /api/v1/scraping/url` - Scrape product URL
- `POST /api/v1/scraping/store` - Scrape entire store
- `POST /api/v1/scraping/feed` - Import feed (CSV/XML/JSON)

### AI
- `POST /api/v1/ai/generate-content` - Generate product content
- `POST /api/v1/ai/optimize-seo` - Optimize SEO
- `POST /api/v1/ai/analyze-pricing` - Analyze pricing
- `POST /api/v1/ai/bulk-enrich` - Bulk AI enrichment
- `GET /api/v1/ai/usage` - Get AI usage stats

### Jobs
- `GET /api/v1/jobs` - List background jobs
- `GET /api/v1/jobs/{id}` - Get job details
- `POST /api/v1/jobs/{id}/cancel` - Cancel job
- `POST /api/v1/jobs/{id}/retry` - Retry failed job
- `GET /api/v1/jobs/stats/summary` - Get job statistics

## Deployment (Fly.io)

```bash
cd apps/api

# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app (first time)
fly launch --no-deploy

# Set secrets
fly secrets set SUPABASE_URL=... SUPABASE_KEY=... JWT_SECRET=...

# Deploy
fly deploy

# Scale workers
fly scale count api=2 worker=2
```

## Celery Tasks

| Task | Queue | Description |
|------|-------|-------------|
| `sync_supplier_products` | sync | Sync products from supplier |
| `sync_supplier_stock` | sync | Sync stock levels |
| `scrape_product_url` | scraping | Scrape single product |
| `scrape_store_catalog` | scraping | Scrape store catalog |
| `import_csv_products` | import | Import from CSV |
| `import_xml_feed` | import | Import from XML |
| `process_order_fulfillment` | orders | Fulfill order |
| `generate_product_content` | ai | Generate AI content |
| `optimize_product_seo` | ai | Optimize SEO |
| `analyze_pricing` | ai | Analyze pricing |

## Health Checks

- `GET /health` - Service health
- `GET /ready` - Readiness probe

## Monitoring

View logs:
```bash
fly logs -a shopopti-api
```

View metrics:
```bash
fly dashboard -a shopopti-api
```

## Architecture

```
apps/api/
├── main.py                  # FastAPI application entry point
├── app/
│   ├── core/
│   │   ├── config.py        # Application configuration
│   │   ├── database.py      # Database connections (Supabase + PostgreSQL)
│   │   └── security.py      # JWT verification, rate limiting
│   ├── api/
│   │   ├── v1/
│   │   │   ├── router.py    # API v1 route aggregator
│   │   │   └── endpoints/   # API endpoints by domain
│   │   └── legacy.py        # Backward compatibility routes
│   ├── queue/
│   │   ├── celery_app.py    # Celery configuration
│   │   ├── tasks.py         # Async task definitions
│   │   └── redis_queue.py   # Redis queue utilities
│   └── services/
│       ├── suppliers/       # Supplier integrations (BigBuy, AliExpress)
│       ├── ai.py            # Lovable AI Gateway integration
│       └── ...              # Other services
```

## Requirements

- Python 3.11+
- Redis (for Celery queue)
- PostgreSQL (via Supabase)

## Installation

```bash
cd apps/api
pip install -r requirements.txt
```

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
JWT_SECRET=your-jwt-secret

# AI
LOVABLE_API_KEY=your-lovable-api-key

# Suppliers (optional)
BIGBUY_API_KEY=your-bigbuy-key
ALIEXPRESS_API_KEY=your-aliexpress-key
```

## Running

### Development

```bash
# Start FastAPI
uvicorn main:app --reload --port 8000

# Start Celery worker
celery -A app.queue.celery_app worker --loglevel=info

# Start Celery beat (scheduler)
celery -A app.queue.celery_app beat --loglevel=info
```

### Production (Fly.io)

```bash
fly deploy
```

## API Documentation

- Swagger UI: `/api/docs`
- ReDoc: `/api/redoc`
- OpenAPI: `/api/openapi.json`

## Architecture Decisions

### Why FastAPI over Edge Functions?

1. **Long-running tasks**: Celery workers handle sync jobs that take minutes/hours
2. **Stateful connections**: Maintain supplier API sessions
3. **Complex orchestration**: Multi-step workflows with retries
4. **Rate limiting**: Per-user rate limiting with Redis
5. **Scalability**: Independent scaling of API vs workers

### Supabase Role

Supabase provides:
- ✅ Authentication (JWT verification)
- ✅ PostgreSQL database
- ✅ File storage
- ✅ Realtime (optional)

Supabase does NOT handle:
- ❌ Business logic execution
- ❌ Long-running jobs
- ❌ Supplier API integrations
- ❌ AI content generation

## Deployment

### Fly.io Configuration

See `fly.toml` for deployment configuration.

### Redis (Upstash)

Use Upstash Redis for serverless Redis:
```
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
```

# ShopOpti FastAPI Backend

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

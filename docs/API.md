# Drop Craft AI - API Documentation

Complete API reference for Drop Craft AI SaaS platform.

## 🌐 Base URLs

- **Production**: `https://dtozyrmmekdnvekissuh.supabase.co/functions/v1`
- **Development**: `http://localhost:54321/functions/v1`

## 🔐 Authentication

All API endpoints require authentication via Supabase JWT tokens.

```bash
# Include in request headers
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

## 📊 Product Import APIs

### AliExpress Integration

Import products from AliExpress marketplace.

**Endpoint**: `POST /aliexpress-integration`

```json
{
  "importType": "trending_products|winners_detected|complete_catalog|global_bestsellers",
  "filters": {
    "category": "Electronics",
    "minPrice": 10,
    "maxPrice": 200,
    "keywords": "wireless headphones",
    "limit": 100
  },
  "userId": "user_id_here"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "import_id": "uuid",
    "total_products": 150,
    "imported_count": 148,
    "failed_count": 2,
    "products": [...] // First 10 products preview
  },
  "message": "Successfully imported 148 products from AliExpress"
}
```

### BigBuy Integration

European supplier integration for dropshipping.

**Endpoint**: `POST /bigbuy-integration`

```json
{
  "action": "get_products|import_products|get_stock|create_order",
  "api_key": "your_bigbuy_api_key",
  "products": [...], // For import_products action
  "user_id": "user_id_here"
}
```

### Shopify Integration

Synchronize with Shopify stores.

**Endpoint**: `POST /shopify-integration`

```json
{
  "action": "connect|sync_products|sync_orders|webhook",
  "shop_domain": "your-store.myshopify.com",
  "access_token": "shpat_xxx",
  "integration_id": "uuid"
}
```

## 🤖 AI Optimization APIs

### AI Content Optimizer

Optimize product descriptions, titles, and SEO.

**Endpoint**: `POST /ai-optimizer`

```json
{
  "jobId": "uuid",
  "jobType": "image_optimization|translation|price_optimization|seo_enhancement",
  "inputData": {
    "products": [...],
    "target_language": "fr",
    "optimization_level": "aggressive"
  }
}
```

### AI Insights

Generate business intelligence reports.

**Endpoint**: `POST /ai-insights`

```json
{
  "report_type": "daily_summary|performance|market_analysis",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "filters": {
    "category": "Electronics",
    "supplier": "AliExpress"
  }
}
```

## 🔄 Real-time Sync API

Synchronize data across all enabled platforms.

**Endpoint**: `POST /real-data-sync`

```json
{
  "platforms": ["aliexpress", "bigbuy", "shopify"],
  "syncType": "products|orders|inventory|all",
  "batchSize": 100,
  "userId": "user_id_here"
}
```

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "platform": "aliexpress",
      "status": "success",
      "imported_products": 250,
      "total_processed": 250
    }
  ],
  "summary": {
    "total_platforms": 3,
    "successful": 2,
    "failed": 0,
    "disabled": 1
  }
}
```

## 📦 Order Management APIs

### Create Order

Create orders on supplier platforms.

**Endpoint**: `POST /create-order`

```json
{
  "platform": "bigbuy|aliexpress|shopify",
  "products": [
    {
      "product_id": "12345",
      "quantity": 2,
      "variant_id": "67890"
    }
  ],
  "shipping_address": {
    "name": "John Doe",
    "address": "123 Main St",
    "city": "Paris",
    "country": "FR",
    "postal_code": "75001"
  },
  "user_id": "user_id_here"
}
```

### Track Shipment

Track order shipments across carriers.

**Endpoint**: `POST /tracking-integration`

```json
{
  "action": "track_package|update_all_tracking",
  "tracking_number": "1Z999AA1234567890",
  "carrier": "ups|fedex|dhl|auto"
}
```

## 🛠️ Maintenance APIs

### System Maintenance

Perform system maintenance tasks.

**Endpoint**: `POST /maintenance`

```json
{
  "action": "cleanup_old_imports|update_stock|optimize_database|generate_reports",
  "params": {
    "days_old": 30,
    "report_type": "daily_summary"
  }
}
```

## 📈 Analytics APIs

### Business Intelligence

Get comprehensive business metrics.

**Endpoint**: `GET /analytics`

**Query Parameters**:
- `start_date`: ISO date string
- `end_date`: ISO date string  
- `group_by`: `day|week|month`
- `metrics`: `sales|products|orders|customers`

## 🔍 Search & Filtering

### Product Search

Search products across all catalogs.

**Endpoint**: `POST /search-products`

```json
{
  "query": "wireless headphones",
  "filters": {
    "category": "Electronics",
    "price_min": 10,
    "price_max": 100,
    "supplier": "AliExpress",
    "rating_min": 4.0
  },
  "sort": "price_asc|price_desc|rating|newest",
  "limit": 50,
  "offset": 0
}
```

## 🚨 Error Handling

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

### Common Error Codes

- `AUTH_REQUIRED`: Authentication token missing or invalid
- `PERMISSION_DENIED`: Insufficient permissions for requested action
- `RATE_LIMIT_EXCEEDED`: Too many requests in time window
- `INTEGRATION_DISABLED`: Requested integration is disabled
- `API_KEY_MISSING`: Required API key not configured
- `VALIDATION_ERROR`: Request data validation failed
- `SERVICE_UNAVAILABLE`: External service temporarily unavailable

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Import APIs | 10 requests | 1 minute |
| AI APIs | 50 requests | 1 hour |
| Search APIs | 100 requests | 1 minute |
| Sync APIs | 5 requests | 5 minutes |

## 🔧 SDKs & Libraries

### JavaScript/TypeScript

```bash
npm install @drop-craft-ai/sdk
```

```javascript
import { DropCraftAPI } from '@drop-craft-ai/sdk'

const api = new DropCraftAPI({
  supabaseUrl: 'https://dtozyrmmekdnvekissuh.supabase.co',
  supabaseKey: 'your_anon_key',
  userToken: 'user_jwt_token'
})

// Import products
const result = await api.importProducts('aliexpress', {
  type: 'trending_products',
  filters: { category: 'Electronics' }
})
```

### Python

```bash
pip install drop-craft-ai-python
```

```python
from drop_craft_ai import DropCraftAPI

api = DropCraftAPI(
    supabase_url='https://dtozyrmmekdnvekissuh.supabase.co',
    supabase_key='your_anon_key',
    user_token='user_jwt_token'
)

# Import products  
result = api.import_products('aliexpress', {
    'type': 'trending_products',
    'filters': {'category': 'Electronics'}
})
```

## 🔗 Webhooks

Configure webhooks to receive real-time notifications.

### Available Events

- `product.imported` - New products imported
- `order.created` - New order created
- `order.updated` - Order status changed
- `integration.connected` - New integration connected
- `ai.job.completed` - AI optimization completed

### Webhook Payload

```json
{
  "event": "product.imported",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "import_id": "uuid",
    "user_id": "uuid",
    "product_count": 150,
    "source": "aliexpress"
  }
}
```

## 📚 Additional Resources

- [Authentication Guide](./AUTHENTICATION.md)
- [Integration Setup](./INTEGRATIONS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Error Troubleshooting](./TROUBLESHOOTING.md)
- [Changelog](../CHANGELOG.md)

---

For support, please visit our [GitHub Issues](https://github.com/adil95400/drop-craft-ai/issues) or contact our support team.
# ShopOpti API Documentation

## Overview

ShopOpti provides a comprehensive REST API through Supabase Edge Functions for e-commerce automation, multi-channel publishing, supplier management, and AI-powered optimization.

**Base URL:** `https://dtozyrmmekdnvekissuh.supabase.co/functions/v1`

**Authentication:** All endpoints require a valid JWT token in the `Authorization` header unless otherwise specified.

```
Authorization: Bearer <your-jwt-token>
```

---

## 🏪 Store Integration APIs

### Shopify Integration

#### `POST /shopify-sync`
Synchronize products from Shopify store.

**Request:**
```json
{
  "action": "sync_products",
  "integration_id": "uuid",
  "options": {
    "full_sync": false,
    "include_variants": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "synced_count": 150,
  "errors": []
}
```

#### `POST /shopify-product-create`
Create a product in Shopify from ShopOpti catalog.

**Request:**
```json
{
  "product_id": "uuid",
  "store_id": "uuid",
  "publish": true
}
```

---

### WooCommerce Integration

#### `POST /woocommerce-sync`
Synchronize products with WooCommerce store.

#### `POST /woocommerce-product-create`
Create product in WooCommerce.

---

### PrestaShop Integration

#### `POST /prestashop-sync`
Synchronize PrestaShop store products.

#### `POST /prestashop-connect`
Establish connection with PrestaShop store.

---

## 📦 Supplier APIs

### Supplier Connection

#### `POST /supplier-connect-advanced`
Connect to a supplier with credentials.

**Request:**
```json
{
  "supplier_id": "uuid",
  "credentials": {
    "api_key": "your-api-key",
    "api_secret": "your-secret"
  },
  "connection_type": "api"
}
```

**Response:**
```json
{
  "success": true,
  "connection_id": "uuid",
  "products_synced": 1500
}
```

#### `POST /supplier-sync-products`
Synchronize products from connected supplier.

**Request:**
```json
{
  "supplier_id": "uuid",
  "full_sync": false
}
```

#### `POST /supplier-test-connection`
Test supplier API connection.

---

### Specific Supplier Integrations

#### CJ Dropshipping
- `POST /add-cj-credentials` - Add CJ API credentials
- `POST /cj-webhook` - Handle CJ webhooks

#### BigBuy
- `POST /bigbuy-sync` - Sync BigBuy products
- `POST /bigbuy-webhook` - Handle BigBuy webhooks

#### BTS Wholesaler
- `POST /bts-feed-sync` - Sync BTS CSV feed

#### Matterhorn
- `POST /matterhorn-webhook` - Handle Matterhorn updates

---

## 🛒 Order & Fulfillment APIs

### Order Management

#### `POST /order-tracking`
Get real-time order tracking information.

**Request:**
```json
{
  "action": "get_tracking",
  "tracking_number": "1234567890",
  "carrier": "ups"
}
```

**Response:**
```json
{
  "success": true,
  "tracking": {
    "status": "in_transit",
    "location": "Paris, France",
    "estimated_delivery": "2024-01-15",
    "events": [
      {
        "date": "2024-01-12T10:30:00Z",
        "status": "departed_facility",
        "location": "Lyon Distribution Center"
      }
    ]
  }
}
```

#### `POST /auto-order-fulfillment`
Automatically place order with supplier.

**Request:**
```json
{
  "order_id": "uuid",
  "supplier_id": "uuid",
  "shipping_method": "standard"
}
```

#### `POST /carrier-select-auto`
Auto-select best carrier for shipment.

#### `POST /label-generate-real`
Generate shipping label.

---

## 🤖 AI & Optimization APIs

### Product Optimization

#### `POST /ai-product-optimizer`
AI-powered product content optimization.

**Request:**
```json
{
  "product_id": "uuid",
  "optimize": ["title", "description", "seo"],
  "mode": "seo",
  "language": "fr"
}
```

**Response:**
```json
{
  "success": true,
  "optimized": {
    "title": "Optimized Product Title",
    "description": "Enhanced product description...",
    "seo_title": "SEO Title | Brand",
    "seo_description": "Meta description for search engines",
    "seo_keywords": ["keyword1", "keyword2"]
  }
}
```

#### `POST /bulk-ai-optimizer`
Bulk AI optimization for multiple products.

#### `POST /ai-price-optimizer`
AI-powered pricing recommendations.

---

### Content Generation

#### `POST /ai-content-generator`
Generate marketing content.

**Request:**
```json
{
  "type": "product_description",
  "product_data": {
    "name": "Product Name",
    "features": ["feature1", "feature2"]
  },
  "tone": "professional",
  "language": "fr"
}
```

#### `POST /ai-social-posts`
Generate social media posts.

#### `POST /ai-ad-creator`
Create advertising content.

---

## 📊 Analytics APIs

### Performance Analytics

#### `POST /advanced-analytics`
Get comprehensive analytics data.

**Request:**
```json
{
  "period": "30d",
  "metrics": ["revenue", "orders", "conversion_rate"],
  "group_by": "day"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 45000,
      "trend": "+12%",
      "by_period": [...]
    },
    "orders": {
      "total": 320,
      "trend": "+8%"
    }
  }
}
```

#### `POST /conversion-analytics`
Detailed conversion funnel analytics.

#### `POST /sales-forecast`
AI-powered sales predictions.

---

## 🌐 Marketplace APIs

### Multi-Channel Publishing

#### `POST /marketplace-publish`
Publish products to marketplaces.

**Request:**
```json
{
  "product_ids": ["uuid1", "uuid2"],
  "marketplaces": ["amazon", "ebay", "etsy"],
  "options": {
    "update_existing": true,
    "apply_rules": true
  }
}
```

#### `POST /amazon-seller-api`
Direct Amazon Seller API integration.

#### `POST /ebay-trading-api`
eBay Trading API integration.

#### `POST /etsy-open-api`
Etsy Open API integration.

---

### Feed Management

#### `POST /feed-manager`
Manage product feeds.

#### `POST /chatgpt-shopping-feed`
Generate ChatGPT Shopping feed.

---

## 🔄 Automation APIs

### Workflow Automation

#### `POST /workflow-executor`
Execute automation workflow.

**Request:**
```json
{
  "workflow_id": "uuid",
  "trigger_data": {
    "event": "new_order",
    "order_id": "uuid"
  }
}
```

#### `POST /automation-engine`
Process automation rules.

---

### Repricing Engine

#### `POST /repricing-engine`
Dynamic repricing execution.

**Request:**
```json
{
  "product_ids": ["uuid1", "uuid2"],
  "strategy": "competitive",
  "min_margin": 15
}
```

---

## 📧 Marketing APIs

### Email Marketing

#### `POST /send-email-campaign`
Send email marketing campaign.

**Request:**
```json
{
  "campaign_name": "Summer Sale",
  "subject": "50% Off Everything!",
  "content": "<html>...</html>",
  "segment": {
    "filter": "active_customers",
    "last_order_days": 30
  }
}
```

---

## 🔐 Security Notes

1. **Rate Limiting:** 100 requests per minute per API key
2. **Authentication:** JWT tokens expire after 1 hour
3. **Webhooks:** Verify signatures using HMAC-SHA256
4. **Data Encryption:** All data transmitted over TLS 1.3

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product ID",
    "details": {}
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request data |
| `RATE_LIMITED` | Too many requests |
| `SUPPLIER_ERROR` | Supplier API error |
| `INTERNAL_ERROR` | Server error |

---

## Webhooks

### Supported Events

- `order.created` - New order placed
- `order.fulfilled` - Order fulfilled
- `product.updated` - Product data changed
- `stock.low` - Stock below threshold
- `sync.completed` - Sync finished
- `price.changed` - Price updated

### Webhook Payload

```json
{
  "event": "order.created",
  "timestamp": "2024-01-12T10:30:00Z",
  "data": {
    "order_id": "uuid",
    "total": 99.99
  },
  "signature": "sha256=..."
}
```

---

## SDK & Libraries

- **JavaScript/TypeScript:** `@shopopti/sdk`
- **Python:** `shopopti-python`
- **PHP:** `shopopti/php-sdk`

---

## Support

- Documentation: https://docs.shopopti.io
- API Status: https://status.shopopti.io
- Support: support@shopopti.io

# Edge Functions Consolidation Plan

## Current State: 387 functions → Target: ~80 consolidated endpoints

### Consolidation Strategy

Each group merges into a single Edge Function with action-based routing:
```
POST /functions/v1/ai-hub  → body: { action: "optimize-product" | "generate-content" | ... }
```

### Consolidation Groups

| Group Prefix | Current Count | Target | Merge Into |
|---|---|---|---|
| `ai-*` | 50 | 3 | `ai-hub`, `ai-content`, `ai-analytics` |
| `supplier-*` | 20 | 2 | `supplier-hub`, `supplier-sync` |
| `shopify-*` | 12 | 2 | `shopify-hub`, `shopify-sync` |
| `extension-*` | 9 | 2 | `extension-hub`, `extension-auth` |
| `sync-*` | 8 | 1 | `sync-hub` |
| `seo-*` | 8 | 1 | `seo-hub` |
| `auto-*` | 8 | 1 | `automation-hub` |
| `stock-*` | 7 | 1 | `stock-hub` |
| `bulk-*` | 7 | 1 | `bulk-operations` |
| `marketplace-*` | 6 | 1 | `marketplace-hub` |
| `import-*` | 6 | 1 | `import-hub` |
| `store-*` | 5 | 1 | `store-hub` |
| `price-*` | 5 | 1 | `pricing-hub` |
| `carrier-*` | 5 | 1 | `carrier-hub` |
| `woocommerce-*` | 4 | 1 | `woocommerce-hub` |
| `winners-*` | 4 | 1 | `winners-hub` |
| `stripe-*` | 4 | 1 | `stripe-hub` |
| `returns-*` | 4 | 1 | `returns-hub` |
| `order-*` | 4 | 1 | `orders-hub` |
| `feed-*` | 4 | 1 | `feed-hub` |
| Others (~100) | ~100 | ~50 | Domain-specific hubs |

### Priority Order

1. **AI Functions (50→3)**: Biggest savings, most duplication
2. **Supplier Functions (20→2)**: Second largest group
3. **Shopify Functions (12→2)**: High traffic, important perf
4. **Remaining groups**: Incremental consolidation

### Implementation Pattern

```typescript
// supabase/functions/ai-hub/index.ts
import { serve } from "https://deno.land/std/http/server.ts"

const handlers: Record<string, (req: Request) => Promise<Response>> = {
  'optimize-product': handleOptimizeProduct,
  'generate-content': handleGenerateContent,
  'analyze-sentiment': handleAnalyzeSentiment,
  // ... merge all ai-* handlers
}

serve(async (req) => {
  const { action, ...params } = await req.json()
  const handler = handlers[action]
  if (!handler) return new Response('Unknown action', { status: 400 })
  return handler(req)
})
```

### Benefits
- **Cold start reduction**: Fewer functions = fewer cold starts
- **Memory efficiency**: Shared imports within a hub
- **Maintainability**: ~80 files vs 387
- **Deploy speed**: 5x faster CI/CD

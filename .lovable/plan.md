

# Plan: Fix Product Catalog Loading (503 Memory Error) + Show All Imported Products

## Problem Diagnosis

Two distinct issues identified:

1. **503 Memory Crash**: The `images` column in the `products` table contains **base64-encoded image data** (up to 13 MB per product). Loading 30 products = ~70 MB, which exceeds the edge function's memory limit. The `/v1/products` endpoint crashes every time.

2. **Imported products invisible**: The `imported_products` table has 32 products that are never shown in the catalog because `listProducts()` only queries the `products` table.

---

## Solution

### Step 1 — Fix the memory crash by excluding `images` from the list query

In `supabase/functions/api-v1/index.ts`, change the `listProducts` SELECT to **not include `images`** at all. Only select `image_url`, `primary_image_url`, and `main_image_url` (which are lightweight URL strings). The `sanitizeProductListItems` function already handles fallback logic.

```text
Before:  .select("id, title, sku, price, ..., images, ...", { count: "exact" })
After:   .select("id, title, sku, price, ..., image_url, primary_image_url, main_image_url, ...", { count: "exact" })
                                                  ^^^^^^ NO images column
```

Update `sanitizeProductListItems` to handle `images` being undefined (empty array fallback).

### Step 2 — Clean up base64 data from the database

Create a migration with a database function that strips base64 entries from the `images` array, keeping only URL strings. This prevents future memory issues even on detail views.

```sql
UPDATE products
SET images = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements_text(images::jsonb) AS elem
  WHERE elem::text NOT LIKE 'data:%'
)
WHERE images::text LIKE '%data:%';
```

### Step 3 — Promote imported products to the catalog

Create an RPC function `promote_imported_to_products` that copies unmatched `imported_products` rows into the `products` table (matching on `sku` or `source_url` to avoid duplicates). This ensures all imported products appear in the catalog.

Alternatively, modify the `listProducts` query to UNION with `imported_products` — but promotion to the canonical `products` table is the cleaner approach per the existing architecture.

### Step 4 — Redeploy the edge function

Deploy the updated `api-v1` function with the fixed SELECT query.

---

## Technical Details

| Item | Detail |
|------|--------|
| Root cause of 503 | `images` column has base64 data, avg 2.3 MB/row |
| Worst offender | Product `6b14c659...` with 13 MB in `images` |
| Products in `products` table | 33 |
| Products in `imported_products` table | 32 (invisible in catalog) |
| Files to edit | `supabase/functions/api-v1/index.ts` |
| Migrations | 1 (clean base64 + optional promote function) |

## Impact
- Catalog page will load instantly (no more 503)
- All imported products will be visible in the catalog
- No data loss — base64 cleanup only removes inline data, keeping URLs


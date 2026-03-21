

# Plan : Corriger la publication de produits vers Shopify

## Probleme identifie

Le flux de publication est **casse** a cause d'une incompatibilite entre les deux Edge Functions :

1. **`marketplace-publish`** (appele depuis le catalogue) envoie un format `{ products: [...], integrationId }` a `import-to-shopify`
2. **`import-to-shopify`** attend un format `{ action: 'import_single', product_id }` ou `{ action: 'import_bulk', product_ids }` et lit depuis la table `supplier_products`

Resultat : l'appel echoue silencieusement (le catch retourne `{ externalId: null }`) et le produit est marque "pending" sans jamais arriver sur Shopify.

De plus, `import-to-shopify` utilise les champs `product.name`, `product.supplier_name` (table `supplier_products`) alors que le catalogue utilise `product.title`, `product.brand` (table `products`).

## Solution

### Etape 1 — Corriger `marketplace-publish/publishToShopify`

Au lieu de deleguer a `import-to-shopify` avec un format incompatible, faire l'appel Shopify Admin API **directement** dans `publishToShopify`. La fonction a deja acces au `product` (depuis la table `products`) et aux credentials.

Le flux corrige :
1. Recuperer le domain/token depuis les credentials de l'integration connectee (`store_integrations`) OU les env vars `SHOPIFY_STORE_PERMANENT_DOMAIN` / `SHOPIFY_ADMIN_ACCESS_TOKEN`
2. Construire le payload Shopify avec les bons champs (`product.title` au lieu de `product.name`)
3. Appeler directement `POST /admin/api/2025-07/products.json`
4. Retourner le `product.id` Shopify comme `externalId`

### Etape 2 — Corriger le mapping des champs

```text
products table       → Shopify API
─────────────────────────────────
title                → title
description          → body_html
brand                → vendor
category             → product_type
tags (text[])        → tags (comma-separated)
price                → variants[0].price
compare_at_price     → variants[0].compare_at_price
sku                  → variants[0].sku
stock_quantity       → variants[0].inventory_quantity
image_url / images   → images[].src
```

### Etape 3 — Gerer les credentials multi-boutiques

Actuellement le code utilise des env vars globales. Pour supporter la boutique connectee specifique :
1. Lire `store_integrations` pour obtenir `credentials` (access_token, domain) de la boutique ciblee
2. Fallback sur les env vars si pas de credentials en base

### Fichiers modifies

- `supabase/functions/marketplace-publish/index.ts` — rreecrire `publishToShopify()` pour appeler Shopify Admin API directement avec les bons champs et credentials dynamiques

## Impact

- Les produits publies depuis `/products` (catalogue) arriveront reellement dans Shopify
- Le `externalId` sera correct, permettant le suivi de sync
- Les boutiques connectees utilisent leurs propres credentials


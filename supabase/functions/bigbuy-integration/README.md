# BigBuy Integration Edge Function

## Description

Intégration avec l'API BigBuy pour la synchronisation de produits, gestion de stock et création de commandes. BigBuy est un fournisseur dropshipping européen avec plus de 100 000 produits.

## Documentation API

- **API Base URL**: `https://api.bigbuy.eu/rest`
- **Documentation officielle**: https://api.bigbuy.eu/
- **Format**: REST JSON
- **Authentication**: Bearer Token (OAuth2)

## Configuration requise

### Secrets Supabase

Ajoutez ces secrets dans le dashboard Supabase :

```bash
BIGBUY_API_KEY=your_bigbuy_api_key_here
```

### Obtention des credentials

1. Créer un compte sur https://www.bigbuy.eu/
2. Aller dans "API" dans votre dashboard
3. Générer une clé API OAuth2
4. La clé peut prendre 24h pour être activée

## Actions disponibles

### 1. `fetch_products` - Récupérer les produits

Récupère la liste des produits du catalogue BigBuy avec support pagination.

**Requête**:
```typescript
await supabase.functions.invoke('bigbuy-integration', {
  body: {
    action: 'fetch_products',
    api_key: 'YOUR_API_KEY',
    limit: 100,
    page: 1,
    category_id: 123 // optionnel
  }
})
```

**Réponse**:
```json
{
  "success": true,
  "products": [...],
  "total": 1250,
  "page": 1,
  "per_page": 100
}
```

**Mapping des champs**:
- `id` → `external_id`
- `name` → `name`
- `retailPrice` → `price`
- `wholesalePrice` → `cost_price`
- `stock` → `stock_quantity`
- `images[0].url` → `image_url`

### 2. `fetch_inventory` - Stock en temps réel

Vérifie le stock disponible pour une liste de produits.

**Requête**:
```typescript
await supabase.functions.invoke('bigbuy-integration', {
  body: {
    action: 'fetch_inventory',
    api_key: 'YOUR_API_KEY',
    product_ids: ['12345', '67890']
  }
})
```

**Réponse**:
```json
{
  "success": true,
  "inventory": [
    {
      "product_id": "12345",
      "stock": 150,
      "available": true
    }
  ]
}
```

### 3. `fetch_pricing` - Prix actualisés

Récupère les prix de gros et détail à jour.

**Requête**:
```typescript
await supabase.functions.invoke('bigbuy-integration', {
  body: {
    action: 'fetch_pricing',
    api_key: 'YOUR_API_KEY',
    product_ids: ['12345', '67890']
  }
})
```

**Réponse**:
```json
{
  "success": true,
  "pricing": [
    {
      "product_id": "12345",
      "retail_price": 49.99,
      "wholesale_price": 29.99,
      "currency": "EUR"
    }
  ]
}
```

### 4. `get_categories` - Liste des catégories

Récupère l'arbre complet des catégories BigBuy.

**Requête**:
```typescript
await supabase.functions.invoke('bigbuy-integration', {
  body: {
    action: 'get_categories',
    api_key: 'YOUR_API_KEY'
  }
})
```

### 5. `create_order` - Créer une commande

Passe une commande auprès de BigBuy pour dropshipping.

**Requête**:
```typescript
await supabase.functions.invoke('bigbuy-integration', {
  body: {
    action: 'create_order',
    api_key: 'YOUR_API_KEY',
    order: {
      products: [
        { id: 12345, quantity: 2 }
      ],
      shipping_address: {
        firstName: "Jean",
        lastName: "Dupont",
        address: "123 Rue de la Paix",
        city: "Paris",
        postcode: "75001",
        country: "FR"
      }
    }
  }
})
```

## Endpoints BigBuy utilisés

| Action | Endpoint | Méthode |
|--------|----------|---------|
| fetch_products | `/rest/catalog/products.json` | GET |
| fetch_inventory | `/rest/catalog/productsstocks.json` | POST |
| fetch_pricing | `/rest/catalog/products.json` | GET |
| get_categories | `/rest/catalog/categories.json` | GET |
| create_order | `/rest/orders` | POST |

## Gestion des erreurs

### Erreurs API courantes

- **401 Unauthorized**: API key invalide ou expirée
- **403 Forbidden**: API key pas encore activée (attendre 24h)
- **429 Too Many Requests**: Rate limit dépassé
- **500 Internal Server Error**: Erreur côté BigBuy

### Retry Logic

L'intégration ne fait PAS de retry automatique. C'est géré au niveau de `automated-sync`.

## Intégration avec automated-sync

La fonction est appelée par `automated-sync` pour :

1. **Synchronisation produits** (`supplier_api`)
   ```typescript
   processSupplierSync() → bigbuy-integration(action: 'fetch_products')
   ```

2. **Mise à jour inventaire** (`inventory_update`)
   ```typescript
   processInventorySync() → bigbuy-integration(action: 'fetch_inventory')
   ```

3. **Mise à jour prix** (`price_update`)
   ```typescript
   processPriceSync() → bigbuy-integration(action: 'fetch_pricing')
   ```

## Limites et quotas

BigBuy applique des rate limits sur l'API :
- **10 000 requêtes/jour** (plan standard)
- **50 requêtes/minute**

Recommandations :
- Batch les requêtes (100 produits max par appel)
- Utiliser pagination intelligente
- Cacher les données catégories (changent rarement)

## Calcul de marge

```typescript
profit_margin = ((retail_price - wholesale_price) / wholesale_price) * 100
```

Exemple :
- Prix de gros : 29.99€
- Prix de vente : 49.99€  
- Marge : 66.7%

## Tests

### Test sans API key (doit échouer proprement)

```bash
curl -X POST https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/bigbuy-integration \
  -H "Content-Type: application/json" \
  -d '{"action": "fetch_products"}'
```

Réponse attendue :
```json
{
  "error": "BigBuy API key not configured. Add BIGBUY_API_KEY to Supabase secrets."
}
```

### Test avec vraie API key

```bash
curl -X POST https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/bigbuy-integration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{"action": "fetch_products", "api_key": "YOUR_BIGBUY_KEY", "limit": 10}'
```

## Monitoring

### Vérifier les logs

```sql
SELECT * FROM activity_logs 
WHERE action LIKE '%bigbuy%' 
ORDER BY created_at DESC 
LIMIT 20;
```

### Tracking des synchronisations

```sql
SELECT 
  COUNT(*) as total_syncs,
  SUM(CASE WHEN result_data->>'success' = 'true' THEN 1 ELSE 0 END) as successful,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM import_jobs
WHERE source_type = 'supplier_api'
AND metadata->>'supplier' = 'bigbuy'
AND created_at > NOW() - INTERVAL '7 days';
```

## Amélirations futures

- [ ] Ajouter cache Redis pour catégories
- [ ] Implémenter webhook pour notifications stock
- [ ] Support multi-devises (actuellement EUR uniquement)
- [ ] Synchronisation images optimisée (CDN)
- [ ] Tracking détaillé des commandes avec BigBuy

## Ressources

- [Documentation API BigBuy](https://api.bigbuy.eu/)
- [Guide d'intégration dropshipping](https://www.bigbuy.eu/dropshipping/)
- [Centre d'aide BigBuy](https://help.bigbuy.eu/)

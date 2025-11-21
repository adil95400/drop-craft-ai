# AliExpress Integration Edge Function

## Configuration requise

### 1. Compte AliExpress Affiliate
- Créer un compte sur: https://portals.aliexpress.com/
- S'inscrire au programme Affiliate
- Obtenir l'App Key et App Secret

### 2. Secrets à configurer
Ajouter ces secrets via Supabase Dashboard:
```bash
ALIEXPRESS_API_KEY=your_app_key_here
ALIEXPRESS_API_SECRET=your_app_secret_here
VITE_ALIEXPRESS_ENABLED=true
```

### 3. API Documentation
- API Docs: https://developers.aliexpress.com/en/doc.htm
- Methods disponibles:
  - `aliexpress.affiliate.product.query` - Recherche produits
  - `aliexpress.affiliate.productdetail.get` - Détails produit
  - `aliexpress.affiliate.category.get` - Catégories

### 4. Limites API
- Rate limiting: 10,000 requêtes/jour
- Max produits par requête: 200
- Timeout: 30 secondes

## Structure de la requête

### Input
```typescript
{
  importType: 'trending_products' | 'complete_catalog' | 'winners_detected' | 'global_bestsellers',
  filters: {
    category?: string,
    keywords?: string,
    minPrice?: number,
    maxPrice?: number,
    minRating?: number,
    country?: string
  },
  userId: string
}
```

### Output
```typescript
{
  success: boolean,
  data: {
    import_id: string,
    total_products: number,
    imported_count: number,
    failed_count: number,
    products: Product[] // Premier 10 pour preview
  },
  message: string
}
```

## Implémentation réelle à faire

1. **Génération signature MD5**
   - Signer chaque requête avec App Secret
   - Voir: https://developers.aliexpress.com/en/doc.htm?docId=27744

2. **Gestion pagination**
   - Boucler sur toutes les pages de résultats
   - Respecter le rate limiting

3. **Transformation données**
   - Mapper les champs AliExpress vers notre schéma
   - Gérer les devises (USD par défaut)

4. **Gestion erreurs**
   - Retry automatique (max 3 fois)
   - Logging détaillé
   - Fallback gracieux

## Test en local

```bash
supabase functions serve aliexpress-integration --env-file .env.local
```

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/aliexpress-integration' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"importType":"trending_products","userId":"test-user-id","filters":{}}'
```

## Monitoring

Logs accessibles via:
```bash
supabase functions logs aliexpress-integration
```

Ou dans le Dashboard Supabase: https://supabase.com/dashboard/project/dtozyrmmekdnvekissuh/functions/aliexpress-integration/logs

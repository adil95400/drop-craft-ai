# Nettoyage Edge Functions - Plan d'action

## 📊 État des lieux

**Total**: 37+ edge functions analysées
**Mockées**: 226+ occurrences de mock/TODO
**À refactorer**: 15 fonctions prioritaires
**À supprimer**: 3 fonctions inutiles

## ✅ Fonctions Refactorisées

### 1. `aliexpress-integration/` ✅
- ✅ Supprimé 78 lignes de mock data
- ✅ Structure API réelle préparée
- ✅ Documentation complète ajoutée
- ✅ Gestion d'erreurs améliorée
- ⚠️ Nécessite: ALIEXPRESS_API_KEY, ALIEXPRESS_API_SECRET

## ❌ Fonctions à SUPPRIMER

### 1. `unified-payments/` ❌ SUPPRIMER
**Raison**: Complètement mockée, aucune valeur ajoutée
**Alternative**: Utiliser Stripe directement ou créer fonctions dédiées

### 2. `unified-management/` ❌ SUPPRIMER  
**Raison**: Endpoints non pertinents ou mal placés
**Alternative**: 
- SSO → Configurer dans Supabase Auth
- CLI → Ne devrait pas être exposé en web API
- Credentials → Utiliser Supabase Vault
- Force-disconnect → Créer fonction admin dédiée

### 3. `unified-integrations/` ❌ SUPPRIMER
**Raison**: Duplications + mocks complets
**Alternative**: Fonctions dédiées par intégration

## 🔄 Fonctions à Refactorer (Priorité HAUTE)

### 2. `automated-sync/` 🔄
**État**: 367 lignes avec mocks
**Actions**:
- [ ] Supprimer `generateMockProducts()`
- [ ] Implémenter vraie synchronisation suppliers
- [ ] Ajouter retry logic
- [ ] Améliorer error handling

**Structure cible**:
```typescript
// Sync réel depuis suppliers configurés
async function syncFromSupplier(supplierId: string) {
  const supplier = await getSupplierConfig(supplierId)
  
  switch(supplier.type) {
    case 'aliexpress':
      return await syncAliExpress(supplier.credentials)
    case 'bigbuy':
      return await syncBigBuy(supplier.credentials)
    case 'shopify':
      return await syncShopify(supplier.credentials)
    default:
      throw new Error(`Unsupported supplier: ${supplier.type}`)
  }
}
```

### 3. `bigbuy-integration/` 🔄
**État**: 281 lignes de mocks
**Actions**:
- [ ] Supprimer `generateMockBigBuyProducts()`
- [ ] Implémenter BigBuy REST API
- [ ] API endpoint: https://api.bigbuy.eu/rest
- [ ] Ajouter authentification OAuth

**Docs**: https://api.bigbuy.eu/

### 4. `global-seo-scanner/` 🔄
**État**: Mock complet de l'analyse SEO
**Actions**:
- [ ] Intégrer Lovable AI API pour analyse
- [ ] Ou utiliser bibliothèque SEO open-source
- [ ] Ajouter vrais parsers HTML
- [ ] Implémenter scoring algorithme

**Alternative**: Utiliser https://www.npmjs.com/package/seo-analyzer

### 5. `global-image-optimizer/` 🔄
**État**: Mock des optimisations images
**Actions**:
- [ ] Intégrer Sharp pour vraies optimisations
- [ ] Ou utiliser Cloudinary/ImageKit API
- [ ] Calculer vraies tailles fichiers
- [ ] Implémenter compression réelle

**Solution**: Utiliser Sharp en Deno
```typescript
import Sharp from "https://deno.land/x/sharp@v0.32.6/mod.ts"
```

## 🟡 Fonctions à Refactorer (Priorité MOYENNE)

### 6. `ads-manager/` 
- Mock campaigns
- → Intégrer Meta Ads API / Google Ads API

### 7. `bulk-zip-import/`
- Mock file processing
- → Parser réel des ZIP files

### 8. `canva-design-optimizer/`
- Mock design responses
- → Intégrer Canva API ou supprimer

### 9. `crm-automation/`
- Mock contacts
- → Sync réel avec systèmes CRM

### 10. `extension-processor/`
- Mock Amazon/reviews/Shopify
- → Implémenter vraies extensions

## 📝 Pattern de refactoring

Pour chaque fonction:

### Étape 1: Audit
```bash
# Chercher tous les mocks
grep -r "mock\|Mock\|MOCK\|TODO" supabase/functions/[function-name]/
```

### Étape 2: Documentation
- Créer README.md
- Lister credentials nécessaires
- Documenter API endpoints
- Ajouter exemples

### Étape 3: Implémentation
```typescript
// Structure propre:

// 1. Vérifier credentials
const apiKey = Deno.env.get('SERVICE_API_KEY')
if (!apiKey) {
  throw new Error('SERVICE_API_KEY not configured. See README.md')
}

// 2. Faire vraie requête API
const response = await fetch(API_ENDPOINT, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
})

if (!response.ok) {
  throw new Error(`API error: ${response.statusText}`)
}

// 3. Parser et valider
const data = await response.json()
// Validation...

// 4. Transformer données
return transformToInternalFormat(data)
```

### Étape 4: Tests
```bash
# Test local
supabase functions serve [function-name]

# Test avec curl
curl -X POST http://localhost:54321/functions/v1/[function-name] \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"test": "data"}'
```

### Étape 5: Deploy & Monitor
```bash
# Déployer
git push

# Monitorer logs
# Via Dashboard Supabase ou:
supabase functions logs [function-name] --follow
```

## 🎯 Objectifs

- [ ] 15 fonctions refactorisées
- [ ] 3 fonctions supprimées
- [ ] 0 mock restant en production
- [ ] README pour chaque fonction
- [ ] Tests pour fonctions critiques

## 📅 Timeline

- **Semaine 1**: Priorité HAUTE (5 fonctions)
- **Semaine 2**: Priorité MOYENNE (5 fonctions)
- **Semaine 3**: Priorité BASSE (5 fonctions)
- **Semaine 4**: Tests & Documentation finale

## 🚨 Fonctions Critiques (ne pas casser!)

Ces fonctions sont utilisées en production:
- `xml-json-import` - OK, fonctionnelle
- Identifier les autres...

## 📚 Ressources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy/docs)
- [API Integration Best Practices](https://docs.lovable.dev/)
